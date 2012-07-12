({
  appDir: 'www',
  dir: 'www-built',
  baseUrl: '.',
  fileExclusionRegExp: /(^example)|(.git)$/,
  map: {
    '*': {
      css: 'require-css/css'
    }
  },
  paths: {
    c: 'css'
  },
  modules: [
    {
      name: 'core-components',
      create: true,
      include: ['components/component', 'css!>>core-components'],
      exclude: ['css']
    },
    {
      name: 'app',
      include: ['css!>>app'],
      exclude: ['core-components', 'css']
    }
  ]
})
