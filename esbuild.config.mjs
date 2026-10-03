import esbuild from "esbuild";
import { builtinModules } from "node:module";
import { copyFile, mkdir } from "node:fs/promises";
import { deployToVault } from "./scripts/deploy-vault.mjs";

const production = process.argv[2] === "production";
const outputDirectory = "dist/pinned-tabs";
await mkdir(outputDirectory, { recursive: true });

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*", ...builtinModules],
  format: "cjs",
  target: "es2021",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: `${outputDirectory}/main.js`,
  minify: false,
  plugins: [{
    name: "package-manifest",
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length === 0) {
          await copyFile("manifest.json", `${outputDirectory}/manifest.json`);
          if (!production) await deployToVault(outputDirectory);
        }
      });
    },
  }],
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
