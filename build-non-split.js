const rewire = require("rewire");

const defaults = rewire("react-scripts/scripts/build.js");
let config = defaults.__get__("config");

config.optimization.splitChunks = {
  cacheGroups: {
    default: false,
  },
};

config.resolve.fallback = {
          "crypto": require.resolve("crypto-browserify"), 
        "stream": require.resolve("stream-browserify"), 
        "assert": require.resolve("assert"), 
        "http": require.resolve("stream-http"), 
        "https": require.resolve("https-browserify"), 
        "os": require.resolve("os-browserify"), 
        "url": require.resolve("url")
}

config.optimization.runtimeChunk = false;

// Renames main.00455bcf.js to main.js
config.output.filename = "static/js/main.js";

// Renames main.b100e6da.css to main.css
config.plugins[5].options.filename = "static/css/[name].css";
config.plugins[5].options.moduleFilename = () =>
  "static/css/all_in_one_file.css";