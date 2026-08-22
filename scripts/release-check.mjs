import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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

function readFlagValue(args, index, flag) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parseArguments(args) {
  let packageOnly = false;
  let retainDirectory;
  let verifyTarball;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--package-only") {
      packageOnly = true;
    } else if (argument === "--retain-tarball") {
      retainDirectory = readFlagValue(args, index, argument);
      index += 1;
    } else if (argument === "--verify-tarball") {
      verifyTarball = readFlagValue(args, index, argument);
      index += 1;
    }
  }

  if (retainDirectory && verifyTarball) {
    throw new Error("--retain-tarball and --verify-tarball cannot be used together");
  }
  if (packageOnly && verifyTarball) {
    throw new Error("--package-only cannot be used with --verify-tarball");
  }

  return {
    packageOnly,
    retainDirectory: retainDirectory ? resolve(retainDirectory) : undefined,
    verifyTarball: verifyTarball ? resolve(verifyTarball) : undefined,
  };
}

const { packageOnly, retainDirectory, verifyTarball } = parseArguments(process.argv.slice(2));

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

function assertManifest(manifest, context) {
  const versions = [
    ...Object.values(manifest.dependencies ?? {}),
    ...Object.values(manifest.devDependencies ?? {}),
  ];
  if (versions.some((version) => String(version).startsWith("workspace:"))) {
    throw new Error(`${context} manifest contains a workspace dependency`);
  }
  if (Object.keys(manifest.dependencies ?? {}).some((name) => name.startsWith("@signal-hub/"))) {
    throw new Error(`${context} manifest contains a private @signal-hub runtime dependency`);
  }
  if (
    manifest.name !== "csv-to-signal" ||
    manifest.version !== "0.4.0" ||
    manifest.license !== "Apache-2.0" ||
    manifest.bin?.["csv-to-signal"] !== "./dist/index.js"
  ) {
    throw new Error(`${context} manifest does not match the approved release identity`);
  }
}

function assertExecutable(path, context) {
  const executable = readFileSync(path, "utf-8");
  if (!executable.startsWith("#!/usr/bin/env node\n") || executable.includes("@signal-hub/")) {
    throw new Error(`${context} executable has an invalid shebang or private workspace import`);
  }
}

function assertPackage(pack) {
  const files = pack.files.map((file) => file.path).sort();
  if (JSON.stringify(files) !== JSON.stringify(expectedFiles)) {
    throw new Error(`Unexpected package files: ${files.join(", ")}`);
  }

  const manifest = JSON.parse(readFileSync(join(cliDirectory, "package.json"), "utf-8"));
  assertManifest(manifest, "Packed");
  assertExecutable(join(cliDirectory, "dist", "index.js"), "Bundled");
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

function findPackageFiles(directory, root = directory) {
  const matches = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      matches.push(...findPackageFiles(path, root));
    } else {
      matches.push(path.slice(root.length + 1));
    }
  }
  return matches;
}

function verifyExistingTarball(tarballPath) {
  if (!existsSync(tarballPath) || !statSync(tarballPath).isFile()) {
    throw new Error(`Tarball does not exist: ${tarballPath}`);
  }

  const temporaryRoot = mkdtempSync(join(tmpdir(), "csv-to-signal-release-check-"));
  try {
    const consumerManifest = {
      name: "csv-to-signal-release-consumer",
      version: "1.0.0",
      private: true,
    };
    writeFileSync(join(temporaryRoot, "package.json"), `${JSON.stringify(consumerManifest)}\n`);
    run("npm", ["install", "--no-audit", "--no-fund", tarballPath], { cwd: temporaryRoot });

    const installedPackage = join(temporaryRoot, "node_modules", "csv-to-signal");
    const installedFiles = findPackageFiles(installedPackage).sort();
    if (JSON.stringify(installedFiles) !== JSON.stringify(expectedFiles)) {
      throw new Error(`Unexpected installed package files: ${installedFiles.join(", ")}`);
    }
    const installedManifest = JSON.parse(
      readFileSync(join(installedPackage, "package.json"), "utf-8"),
    );
    assertManifest(installedManifest, "Installed package");
    assertExecutable(join(installedPackage, "dist", "index.js"), "Installed");

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

    const bytes = readFileSync(tarballPath);
    process.stdout.write(
      `Release candidate verified: ${installedManifest.name}@${installedManifest.version}\n` +
        `Tarball: ${tarballPath}\n` +
        `Size: ${bytes.length} bytes\n` +
        `Integrity: sha512-${createHash("sha512").update(bytes).digest("base64")}\n`,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

if (verifyTarball) {
  verifyExistingTarball(verifyTarball);
  process.exit(0);
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

if (retainDirectory && (!existsSync(retainDirectory) || !statSync(retainDirectory).isDirectory())) {
  throw new Error(`Retained tarball directory does not exist: ${retainDirectory}`);
}

const packageDirectory =
  retainDirectory ?? mkdtempSync(join(tmpdir(), "csv-to-signal-release-package-"));
try {
  const packResult = JSON.parse(
    run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", packageDirectory], {
      cwd: cliDirectory,
      capture: true,
    }),
  )[0];
  assertPackage(packResult);

  const tarballPath = join(packageDirectory, packResult.filename);
  if (!existsSync(tarballPath) || statSync(tarballPath).size !== packResult.size) {
    throw new Error("Packed tarball is missing or has an unexpected size");
  }
  verifyExistingTarball(tarballPath);
} finally {
  if (!retainDirectory) {
    rmSync(packageDirectory, { recursive: true, force: true });
  }
}
