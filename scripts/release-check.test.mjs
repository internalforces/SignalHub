import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const releaseScript = join(repositoryRoot, "scripts", "release-check.mjs");

test(
  "retains one package tarball and verifies those exact bytes without repacking",
  { timeout: 180_000 },
  () => {
    const artifactDirectory = mkdtempSync(join(tmpdir(), "csv-to-signal-artifact-"));

    try {
      execFileSync(
        process.execPath,
        [releaseScript, "--package-only", "--retain-tarball", artifactDirectory],
        { cwd: repositoryRoot, encoding: "utf-8", stdio: "pipe" },
      );

      const tarballs = readdirSync(artifactDirectory).filter((name) => name.endsWith(".tgz"));
      assert.equal(tarballs.length, 1);

      const tarballPath = join(artifactDirectory, tarballs[0]);
      const output = execFileSync(
        process.execPath,
        [releaseScript, "--verify-tarball", tarballPath],
        { cwd: repositoryRoot, encoding: "utf-8", stdio: "pipe" },
      );
      assert.match(output, new RegExp(`Tarball: ${tarballPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    } finally {
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  },
);
