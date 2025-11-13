const { build } = require("esbuild");
const { GasPlugin } = require("esbuild-gas-plugin");

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/bundle.js",
  format: "iife", // Immediately Invoked Function Expression
  globalName: "JulesApp", // The global variable name in Apps Script
  plugins: [GasPlugin],
}).catch(() => process.exit(1));
