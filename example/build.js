({
  appDir: 'www',
  dir: 'www-built',
  baseUrl: '.',
  fileExclusionRegExp: /(^example)|(.git)$/,
  separateCSS: true,
  map: {
    '*': {
      css: 'require-css/main'
    }
  },
  modules: [
  {
    name: 'app',
    include: ['css!>>app'], //(remove this if using the 'onLayerComplete' pull request)
    exclude: ['core-components']
  },
  {
    name: 'core-components',
    create: true,
    include: ['components/component',
              'css!>>core-components'], //(remove this if using the 'onLayerComplete' pull request)
    exclude: ['css']
  }
  ]
  //name: 'app.js',
  //out: 'app-built.js'
})
