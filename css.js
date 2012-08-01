define(['require', 'module', './css.api'], function(require, module, cssAPI) {
  console.log('define css');
  var css = {};
  
  var client = require.isBrowser;
  var devMode = module.config().blockingDevelopmentMode || false;
  
  css.pluginBuilder = './css.pluginBuilder';
    
  css.stylesheet = undefined;
  
  
  cssAPI.onBufferWrite = function() {
    if (client)
      css.applyBufferStyle();
  }
  
  css.add = function() {
    return cssAPI.add.apply(cssAPI, arguments);
  }
  css.clear = function() {
    return cssAPI.clear.apply(cssAPI, arguments);
  }
  
  //support for CSS-API-style handlers for live editing
  css.addHandler = function(css, basePath, handler) {
    if (handler === undefined)
      handler = basePath;
      
    cssAPI.add('/*+ ' + handler + ' */\n' + css + '\n/*- ' + handler + '*/', basePath);
  }
    
  //client-only function!
  css.applyBufferStyle = function() {
    //no link element - create
    if (this.stylesheet === undefined) {
      this.stylesheet = document.createElement('style');
      this.stylesheet.setAttribute('type', 'text/css');
      document.getElementsByTagName('head')[0].appendChild(this.stylesheet);
    }
    this.stylesheet.innerHTML = cssAPI.convertStyleBase(cssAPI.buffer, require.toUrl('.'), document.baseURI);
  }

  css.load = function(name, req, load, config) {
    if (name.substr(name.length - 1, 1) == '!') {
      name = name.substr(0, name.length - 2);
      load(css);
      return;
    }
      
    if (name.substr(0, 2) == '>>')
      throw 'CSS buffer points can only be defined for builds.';
    
    if (devMode)
      return;
    
    req(['text!' + name + '.css'], function(CSS) {
      cssAPI.add(CSS, name);
      load(css);
    });
  };
  
  return css;
});
