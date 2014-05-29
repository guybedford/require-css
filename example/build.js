({
  // appDir: 'www',
  // dir: 'www-built',
  mainConfigFile: 'www/requirejs.conf.js',
  fileExclusionRegExp: /(^example)|demo|(^lib\/(cajon))|(.git)$/,
  cjsTranslate: true,
  //separateCSS: true,
  //buildCSS: false,
  optimizeCss: "node",
  optimize: 'none',
  stubModules: ['text', 'json'],
  // modules: [
  // {
  //   name: 'app',
  //   exclude: ['app/core-components'],
  // },
  // {
  //   name: 'app/core-components',
  //   create: true,
  //   include: ['components/component'], 
  //   exclude: ['require-css/normalize']
  // },
  // {
  //   name: 'popup',
  //   exclude: ['app/core-components', 'require-css/normalize']
  // }
  // ],
  name: 'app',
  include: ['almond', 'popup'],
  exclude: ['css/normalize'],
  out: 'app-built.js',
  pragmasOnSave: {
    excludeRequireCss: true
  },
  onBuildRead: function(moduleName, path, contents) {
    switch (moduleName) {
      case "rework":
        contents = "define([], function(require, exports, module) {" + contents + "});";
    }
    return contents;
  }
})
