define(['require', 'module', './css.api'], function(require, module, cssAPI) {
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
    
    //IE
    if (this.stylesheet.styleSheet)
      this.stylesheet.styleSheet.cssText += cssAPI.convertStyleBase(cssAPI.buffer, require.toUrl('.'), document.baseURI);
    //Others
    else
      this.stylesheet.innerHTML += cssAPI.convertStyleBase(cssAPI.buffer, require.toUrl('.'), document.baseURI);
  }

  css.load = function(name, req, load, config) {
    if (name.substr(name.length - 1, 1) == '!')
      name = name.substr(0, name.length - 2);
      
    if (name.substr(0, 2) == '>>')
      throw 'CSS buffer points can only be defined for builds.';
    
    req(['text!' + name + '.css'], function(CSS) {
      css.add(CSS, name);
      load(cssAPI);
    });
  };
  
  return css;
});
