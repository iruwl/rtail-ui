// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: { url: '/', static: true },
    src: { url: '/src' },
    // js1: { url: "/node_modules/bootstrap/dist/js", static: true },
    "node_modules/bootstrap/dist/css": {
      url: "/css"
    },
    "node_modules/bootstrap/dist/js": {
      url: "/js"
    },
    "node_modules/socket.io/client-dist": {
      url: "/js"
    },
  },
  plugins: [
    /* ... */
  ],
  packageOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
  },
};
