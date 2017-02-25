({
  appDir: 'www',
  dir: 'www-built',
  baseUrl: '.',
  fileExclusionRegExp: /(^example)|(.git)|(node_modules)|(bower_components)|(test)$/,
  //separateCSS: true,
  //buildCSS: false,
  optimizeCss: "none",
  map: {
    '*': {
      css: 'require-css/css'
    }
  },
  modules: [
  {
    name: 'app',
    exclude: ['app/core-components'],
  },
  {
    name: 'app/core-components',
    create: true,
    include: ['components/component'], 
    exclude: ['require-css/normalize']
  },
  {
    name: 'popup',
    exclude: ['app/core-components', 'require-css/normalize']
  }
  ]
  //name: 'app.js',
  //out: 'app-built.js'
})
