import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliDirectory = join(repositoryRoot, "apps", "cli");
const expectedFiles = ["LICENSE", "README.md", "dist/index.js", "package.json"];
const packageOnly = process.argv.includes("--package-only");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repositoryRoot,
    encoding: "utf-8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stderr ?? "");
      process.stderr.write(result.stdout ?? "");
    }
    throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}`);
  }

  return result.stdout ?? "";
}

function runExpectFailure(command, args, options) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf-8",
    stdio: "pipe",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status === 0 || !options.stderrPattern.test(result.stderr ?? "")) {
    throw new Error(`Expected ${command} to fail with ${options.stderrPattern}`);
  }
}

function assertPackage(pack) {
  const files = pack.files.map((file) => file.path).sort();
  if (JSON.stringify(files) !== JSON.stringify(expectedFiles)) {
    throw new Error(`Unexpected package files: ${files.join(", ")}`);
  }

  const manifest = JSON.parse(readFileSync(join(cliDirectory, "package.json"), "utf-8"));
  const versions = [
    ...Object.values(manifest.dependencies ?? {}),
    ...Object.values(manifest.devDependencies ?? {}),
  ];
  if (versions.some((version) => String(version).startsWith("workspace:"))) {
    throw new Error("Packed manifest contains a workspace dependency");
  }
  if (Object.keys(manifest.dependencies ?? {}).some((name) => name.startsWith("@signal-hub/"))) {
    throw new Error("Packed manifest contains a private @signal-hub runtime dependency");
  }
  if (
    manifest.name !== "csv-to-signal" ||
    manifest.version !== "0.4.0" ||
    manifest.license !== "Apache-2.0" ||
    manifest.bin?.["csv-to-signal"] !== "./dist/index.js"
  ) {
    throw new Error("Packed manifest does not match the approved release identity");
  }

  const executable = readFileSync(join(cliDirectory, "dist", "index.js"), "utf-8");
  if (!executable.startsWith("#!/usr/bin/env node\n") || executable.includes("@signal-hub/")) {
    throw new Error("Bundled executable has an invalid shebang or private workspace import");
  }
}

function findDatabaseFiles(directory) {
  const matches = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      matches.push(...findDatabaseFiles(path));
    } else if (entry.name.endsWith(".db")) {
      matches.push(path);
    }
  }
  return matches;
}

if (!packageOnly) {
  run("pnpm", ["install", "--frozen-lockfile"]);
  run("pnpm", ["exec", "turbo", "run", "build", "--force"]);
  run("pnpm", ["exec", "turbo", "run", "test", "--force"]);
  run("pnpm", ["exec", "turbo", "run", "typecheck", "--force"]);
  run("pnpm", ["audit", "--prod", "--audit-level=high"]);
  run("pnpm", ["audit"]);
} else {
  run("pnpm", ["--filter", "csv-to-signal...", "build"]);
}

const dryRun = JSON.parse(
  run("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: cliDirectory,
    capture: true,
  }),
);
assertPackage(dryRun[0]);

const temporaryRoot = mkdtempSync(join(tmpdir(), "csv-to-signal-release-check-"));
try {
  const packResult = JSON.parse(
    run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", temporaryRoot], {
      cwd: cliDirectory,
      capture: true,
    }),
  )[0];
  assertPackage(packResult);

  const tarballPath = join(temporaryRoot, packResult.filename);
  if (!existsSync(tarballPath) || statSync(tarballPath).size !== packResult.size) {
    throw new Error("Packed tarball is missing or has an unexpected size");
  }

  const consumerManifest = {
    name: "csv-to-signal-release-consumer",
    version: "1.0.0",
    private: true,
  };
  writeFileSync(join(temporaryRoot, "package.json"), `${JSON.stringify(consumerManifest)}\n`);
  run("npm", ["install", "--no-audit", "--no-fund", tarballPath], { cwd: temporaryRoot });

  const executable = join(
    temporaryRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "csv-to-signal.cmd" : "csv-to-signal",
  );
  writeFileSync(
    join(temporaryRoot, "prices.csv"),
    "metricId,timestamp,value\ndemo.price,2026-08-01T00:00:00Z,100\ndemo.price,2026-08-02T00:00:00Z,125\n",
  );

  const stdout = run(executable, ["analyze", "prices.csv", "--window-hours", "24"], {
    cwd: temporaryRoot,
    capture: true,
  });
  const signals = JSON.parse(stdout);
  const windowedSignal = Array.isArray(signals)
    ? signals.find((signal) => JSON.parse(signal.id)[0] === "windowed-change")
    : undefined;
  if (
    !Array.isArray(signals) ||
    signals.length !== 2 ||
    signals[0].metricId !== "demo.price" ||
    windowedSignal?.changePercent !== 25
  ) {
    throw new Error("Installed CLI did not produce the expected signal output");
  }
  if (!existsSync(join(temporaryRoot, "data.db"))) {
    throw new Error("Installed CLI did not create data.db in the consumer working directory");
  }

  const installedPackage = join(temporaryRoot, "node_modules", "csv-to-signal");
  if (findDatabaseFiles(installedPackage).length > 0) {
    throw new Error("Installed package contains a database file");
  }

  runExpectFailure(executable, ["bogus", "prices.csv"], {
    cwd: temporaryRoot,
    stderrPattern: /Usage:/,
  });
  writeFileSync(join(temporaryRoot, "invalid.csv"), "wrong,header,columns\n1,2,3\n");
  runExpectFailure(executable, ["analyze", "invalid.csv"], {
    cwd: temporaryRoot,
    stderrPattern: /Invalid CSV header/,
  });

  process.stdout.write(
    `Release candidate verified: ${packResult.name}@${packResult.version}\n` +
      `Tarball: ${tarballPath}\n` +
      `Size: ${packResult.size} bytes\n` +
      `Integrity: ${packResult.integrity}\n`,
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
