import esbuild from "esbuild";
import builtins from "builtin-modules";

const banner =
  "/* eslint-disable */\n" +
  "this.global = this;\n" +
  "this.globalThis = this;\n";

const prod = process.argv[2] === "production";
const ctx = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", ...builtins],
  format: "cjs",
  platform: "browser",
  target: "es2022",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: prod,
});

if (prod) {
  await ctx.rebuild();
  await ctx.dispose();
} else {
  await ctx.watch();
  console.log("Watching for changes...");
}
