/*
 * css! loader plugin
 * Allows for loading stylesheets with the 'css!' syntax.
 * 
 *
 * Supports 3 loaders:
 * -<link> loading:
 *   used in the browser, when the link onLoad event is supported (most modern browsers)
 *   this is the best support as it fires after assets have been loaded and css is applied
 *   
 * -<style> loading:
 *  used in the browser, as a fallback when the link onLoad event is not supported
 *  the css is manually downloaded then injected into the style element
 * 
 * -buffer loading: used when on the server. simply ammends the css onto a buffer object (css.buffer.buffer)
 *
 * Dynamic loading and injection can also be performed, by directly accessing the loader APIs.
 *
 * Alternatively the loader can be specified in the RequireJS css config:
 *
 * config: {
 *   css: {
 *     loaderID: './link',
 *     definedCSS: ['clearfix', 'asdf', 'aasdf']
 *   }
 * }
 *
 * Otherwise environment detection will be used as listed.
 *
 */
define(['module', 'require', './normalize', 'text'], function(module, require, normalize, text) {
  
  var baseUrl = require.toUrl('.');
  
  var cssAPI = {};

  //string hashing for naming css strings allowing for reinjection avoidance
  //courtesy of http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
  var djb2 = function(str) {
    var hash = 5381;
    for (i = 0; i < str.length; i++)
      hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    return hash;
  }
  
  cssAPI.pluginBuilder = './css.pluginBuilder';
  
  cssAPI.buffer = {};
  cssAPI.Buffer = {
    inject: function(name, css, reinject) {
      if (css === undefined && reinject === undefined)
        name = djb2((css = name));
      else if (typeof css == 'boolean' && reinject === undefined) {
        reinject = css;
        css = name;
      }
      if (cssAPI.buffer[name] !== undefined && !reinject)
        return;
      
      cssAPI.buffer[name] = css;
    },
    load: function(fileUrl, complete, reload) {
      //dont reload
      if (cssAPI.buffer[fileUrl] !== undefined && !reload)
        return complete();
      
      var self = this;
      text.get(fileUrl, function(css) {
        var css = normalize(css, fileUrl, baseUrl);
        self.inject(fileUrl, css, reload);
        complete();
      });
    },
    clear: function(name) {
      if (name)
        delete cssAPI.buffer[name];
      else
        for (var o in cssAPI.buffer)
          delete cssAPI.buffer[o];
    }
  };
  
  cssAPI.tracker = {};
  
  var definedCSS = module.config().definedCSS
  if (definedCSS)
    for (var i = 0; i < definedCSS.length; i++)
      cssAPI.tracker[definedCSS[i]] = true;
  
  cssAPI.Style = {
    inject: function(name, css, reinject) {
      if (css === undefined && reinject === undefined)
        name = djb2((css = name));
      else if (typeof css == 'boolean' && reinject === undefined) {
        reinject = css;
        css = name;
      }      
      if (cssAPI.tracker[name] !== undefined && !reinject)
        return;
      
      //create stylesheet if necessary
      if (cssAPI.stylesheet === undefined) {
        cssAPI.stylesheet = document.createElement('style');
        cssAPI.stylesheet.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(cssAPI.stylesheet);
      }
      
      var curCSS = cssAPI.stylesheet.styleSheet ? cssAPI.stylesheet.styleSheet.cssText : cssAPI.stylesheet.innerHTML;
      
      if (cssAPI.tracker[name] && cssAPI.tracker[name].startIndex)
        //if already there, only update existing
        curCSS = curCSS.substr(0, cssAPI.tracker[name].startIndex) + css + curCSS.substr(cssAPI.tracker[name].endIndex);
      
      else {
        //add styles and track the name position
        cssAPI.tracker[name] = {
          startIndex: curCSS.length,
          endIndex: curCSS.length + css.length - 1
        };
        
        curCSS += css;
      }
      
      if (cssAPI.stylesheet.styleSheet)
        cssAPI.stylesheet.styleSheet.cssText = curCSS;
      else
        cssAPI.stylesheet.innerHTML = curCSS;      
    },
    load: function(fileUrl, complete, reload) {
      //dont load if already loaded
      if (cssAPI.tracker[fileUrl] !== undefined && !reload)
        return complete();
      
      var self = this;
      text.get(fileUrl, function(css) {
        css = normalize(css, fileUrl, baseUrl);
        self.inject(fileUrl, css, reload);
        complete();
      });
    },
    clear: function(name) {
      //nb may need to clear currently loading
      if (name) {
        if (cssAPI.tracker[name]) {
          cssAPI.inject(name, '', true);
          delete cssAPI.tracker[name];
        }
      }
      else {
        for (var t in cssAPI.tracker)
          delete cssAPI.tracker[t];
        
        if (cssAPI.stylesheet.styleSheet)
          cssAPI.stylesheet.styleSheet.cssText = '';
        else
          cssAPI.stylesheet.innerHTML = '';
      }
    }
  };
  
  if (module.config().loaderID) {
    //dynamically load the moduleID loaderID to use as the loader
    //mix in all the properties, and set the 'loaderName' property
  }
  else if (require.isBrowser)
    cssAPI.loaderName = 'Style'
  else {
    //var bufferAPI = require('buffer'). extend(cssAPI, bufferAPI)
    //loaderName set automatically as part of extend
    //load the buffer API
    cssAPI.loaderName = 'Buffer';
  }
  
  cssAPI.load = function(name, req, load, config) {
    if (name.substr(name.length - 5, 4) != '.css')
      name += '.css';
    cssAPI[cssAPI.loaderName].load(req.toUrl(name), function() {
      load(cssAPI);
    });
  }
  cssAPI.clear = function(name) {
    cssAPI[cssAPI.loaderName].clear(name);
  }
  cssAPI.inject = function(name, css, reinject) {
    cssAPI[cssAPI.loaderName].inject(name, css, reinject);
  }
  
  return cssAPI;
});
