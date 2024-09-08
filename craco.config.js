module.exports = {
  webpack: {
    configure: {
      resolve: {
		  extensions: [ '.ts', '.js' ],
        fallback: {
        "crypto": require.resolve("crypto-browserify"), 
        "stream": require.resolve("stream-browserify"), 
		"buffer": require.resolve("buffer"),
        "assert": require.resolve("assert"), 
        "http": require.resolve("stream-http"), 
        "https": require.resolve("https-browserify"), 
        "os": require.resolve("os-browserify"),
		"vm": require.resolve("vm-browserify"),
		"zlib": require.resolve("browserify-zlib"), 
        "url": require.resolve("url")
        }
      },
    },
  },
}