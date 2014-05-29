require.config({
  baseUrl: '.',
  paths: {
    rework: 'lib/rework/rework',
    'json': 'lib/requirejs-plugins/src/json',
    almond: 'lib/almond/almond'
  },
  map: {
    // '*': {
    //   'css': 'require-css/css'
    // } 
  },
  packages: [{
    name: 'css',
    location: 'require-css',
    main: 'css'
  }],
  css: {
    transformEach: [
      'tools/transform-css',
      {
        // can run async
        requirejs: 'tools/prefix-css-requirejs',
        // node module must run synchronously
        node: 'tools/prefix-css-node'
      }
    ]
  },
  shim: {
    rework: {
      exports: 'rework'
    }
  }
});