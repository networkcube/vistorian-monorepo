import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";

export default {
  input: "build/src/index.js",
  external: ["lz-string", "reorder.js", "netclustering", "swiftset", "three"],
  output: {
    file: "lib/vistorian-core.js",
    format: "umd",
    sourcemap: true,
    name: "vc",
    globals: {
      "lz-string": "LZString",
      "reorder.js": "reorder",
      netclustering: "netClustering",
      swiftset: "Set",
    },
  },
  plugins: [nodeResolve(), commonjs(), json(), sourcemaps()],
};
