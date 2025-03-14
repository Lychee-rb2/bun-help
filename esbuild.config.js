// eslint-disable-next-line @typescript-eslint/no-require-imports
const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["./src/extension.ts"],
  bundle: true,
  outfile: "./out/extension.js",
  platform: "node",
  format: "cjs",
  external: ["vscode"],
  sourcemap: true,
  minify: false,
  target: "node16",
});
