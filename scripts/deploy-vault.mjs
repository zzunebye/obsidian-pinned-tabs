import { copyFile, lstat, mkdir, readFile, readlink, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

export async function deployToVault(
  outputDirectory = path.join(projectRoot, "dist", "pinned-tabs"),
) {
  let vault = process.env.OBSIDIAN_VAULT_PATH;
  if (!vault) {
    const config = await readFile(path.join(projectRoot, "vault.config.json"), "utf8")
      .catch((error) => {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
        throw error;
      });
    if (config !== undefined) {
      const parsed = JSON.parse(config);
      if (typeof parsed.vaultPath !== "string" || !path.isAbsolute(parsed.vaultPath)) {
        throw new Error("vault.config.json must contain an absolute vaultPath.");
      }
      vault = parsed.vaultPath;
    }
  }
  if (!vault) return false;
  if (!path.isAbsolute(vault)) throw new Error("OBSIDIAN_VAULT_PATH must be an absolute path.");
  const destination = path.join(vault, ".obsidian", "plugins", "pinned-tabs");
  const output = path.resolve(projectRoot, outputDirectory);
  const pluginFolder = path.join(vault, ".obsidian", "plugins");

  await lstat(pluginFolder);
  await lstat(path.join(output, "main.js"));
  await lstat(path.join(output, "manifest.json"));

  const existing = await lstat(destination).catch((error) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  });

  if (existing?.isSymbolicLink()) {
    const currentTarget = path.resolve(path.dirname(destination), await readlink(destination));
    if (currentTarget !== output) {
      throw new Error(`Existing plugin link points elsewhere and was preserved: ${destination}`);
    }
    await unlink(destination);
  } else if (existing && !existing.isDirectory()) {
    throw new Error(`Existing plugin destination is not a directory and was preserved: ${destination}`);
  }

  await mkdir(destination, { recursive: true });
  await copyFile(path.join(output, "main.js"), path.join(destination, "main.js"));
  await copyFile(path.join(output, "manifest.json"), path.join(destination, "manifest.json"));
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!(await deployToVault())) {
    throw new Error("Set OBSIDIAN_VAULT_PATH or configure vault.config.json before deploying.");
  }
  console.log("Built plugin files copied to the configured vault.");
}
