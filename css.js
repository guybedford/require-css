/*
 * css! loader plugin
 * Allows for loading stylesheets with the 'css!' syntax.
 *
 * css.inject(css)
 * css.inject(cssId, css)
 * css.inject(cssId, css, rewrite)
 * css.loadFile(cssId, complete)
 * css.loadFile(cssId, fileUrl, complete)
 * css.loadFile(cssId, fileUrl, complete, reload)
 * css.clear(cssId)
 * css.clear()
 * 
 * 
 * '!' suffix skips load checking
 *
 */
define(['module', 'require', './normalize', 'text'], function(module, require, normalize, text) {
  
  if (!require.isBrowser)
    return {
      load: function(name, req, load, config) {
        load();
      }
    };
  
  var baseUrl = require.toUrl('.');
  var head = document.getElementsByTagName('head')[0];
  
  //main api object
  var cssAPI = {};
  
  cssAPI.pluginBuilder = './css.pluginBuilder';
  
  //used to track all css injections
  cssAPI.defined = {};
  
  //<style> tag creation, setters and getters
  var stylesheet;
  var style = {
    create: function() {
      //create stylesheet if necessary
      if (stylesheet === undefined) {
        stylesheet = document.createElement('style');
        stylesheet.type = 'text/css';
        head.appendChild(stylesheet);
      }
    },
    set: function(css) {
      this.create();
      if (stylesheet.styleSheet)
        stylesheet.styleSheet.cssText = css;
      else
        stylesheet.innerHTML = css;
    },
    get: function() {
      this.create();
      return stylesheet.styleSheet ? stylesheet.styleSheet.cssText : stylesheet.innerHTML;
    }
  };
  
  //string hashing for naming css strings allowing for reinjection avoidance
  //courtesy of http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
  var djb2 = function(str) {
    var hash = 5381;
    for (i = 0; i < str.length; i++)
      hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    return hash;
  }
  
  //public API methods
  cssAPI.inject = function(cssId, css, reinject) {
    if (css === undefined && reinject === undefined)
      cssId = djb2((css = cssId));
    else if (typeof css == 'boolean' && reinject === undefined) {
      reinject = css;
      css = cssId;
    }      
    if (cssAPI.defined[cssId] !== undefined && !reinject)
      return;
    
    var curCSS = style.get();
    
    var def;
    if ((def = cssAPI.defined[cssId]) && typeof def.index == 'number')
      //if already there, only update existing
      curCSS = curCSS.substr(0, def.index) + css + curCSS.substr(def.index + def.length);
    
    else {
      //add styles and track the name position
      cssAPI.defined[cssId] = {
        index: curCSS.length,
        length: css.length
      };
      
      curCSS += css;
    }
    
    style.set(curCSS);
      
    return cssId;
  }
  
  cssAPI.get = function(cssId) {
    var curCSS = style.get();
    
    if (!cssId)
      return curCSS;
    
    var def;
    if (!(def = cssAPI.defined[cssId]))
      return null;
    
    if (typeof cssAPI.defined[cssId].index == 'number')
      return curCSS.substr(def.index, def.length);
    else
      return true;
  }
  
  //takes a cssId - the equivalent of a moduleId for locating css files relative to the baseUrl
  cssAPI.loadFile = function(cssId, complete, reload) {
    complete = complete || function(){};
    //dont load if already loaded
    if (cssAPI.defined[cssId] !== undefined && !reload)
      return complete(cssAPI);
    
    var fileUrl = cssId;
      
    var skipLoad = false;
    if (fileUrl.substr(fileUrl.length - 1, 1) == '!') {
      fileUrl = fileUrl.substr(0, fileUrl.length - 1);
      skipLoad = true;
    }
    
    if (fileUrl.substr(fileUrl.length - 4, 4) != '.css')
      fileUrl += '.css';
    
    fileUrl = require.toUrl(fileUrl);
    
    //external url -> add as a <link> tag to load. onload support not reliable so not provided
    if (fileUrl.substr(0, 7) == 'http://' || fileUrl.substr(0, 8) == 'https://') {
      if (skipLoad != true)
        throw 'External URLs only loaded without onload support. You must add the "!" suffix to indicate this.';
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = fileUrl;
      head.appendChild(link);
      
      //only instant callback due to onload not being reliable
      cssAPI.defined[cssId] = true;
      complete(cssAPI);
    }
    //internal url -> download and inject into <style> tag
    else {
      text.get(fileUrl, function(css) {
        css = normalize(css, fileUrl, baseUrl);
        cssAPI.inject(cssId, css, reload);
        if (!skipLoad)
          complete(cssAPI);
      });
      if (skipLoad)
        complete(cssAPI);
    }
  }
  cssAPI.clear = function(cssId) {
    //nb may need to clear currently loading
    if (cssId) {
      if (cssAPI.defined[cssId]) {
        cssAPI.inject(cssId, '', true);
        delete cssAPI.defined[cssId];
      }
    }
    else {
      for (var t in cssAPI.defined)
        delete cssAPI.defined[t];
      
      style.set('');
    }
  }
  
  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 1, 1) == '!')
      return normalize(name.substr(0, name.length - 1)) + '!';
    return normalize(name);
  }
  
  cssAPI.load = function(name, req, load, config) {
    cssAPI.loadFile(name, load);
  }
  
  return cssAPI;
});
