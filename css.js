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
 *     loader: 'style'
 *   }
 * }
 *
 * Otherwise environment detection will be used as listed.
 *
 */
define(['module', 'require', './normalize', './onload-support', 'text'], function(module, require, normalize, onLoadSupport, text) {
  
  var baseUrl = require.toUrl('.');
  
  var cssAPI = {};
  
  cssAPI.pluginBuilder = './css.pluginBuilder';
  
  var loaders = {};
  
  var bufferAPI = loaders.buffer = {
    buffer: {},
    inject: function(name, css) {  
      bufferAPI.buffer[name] = css;
    },
    load: function(fileUrl, complete) {
      //dont load if already loaded
      if (bufferAPI.buffer[fileUrl]) {
        complete();
        return;
      }
      text.get(fileUrl, function(css) {
        css = nomalize(css, fileUrl, baseUrl);
        bufferAPI.inject(fileUrl, css);
        complete();
      });
    },
    clear: function() {
      for (var k in bufferAPI.buffer)
        delete bufferAPI.buffer[k];
    }
  };
  
  var styleAPI = loaders.style = {
    tracker: {},
    inject: function(name, css) {
      
      //create stylesheet if necessary
      if (styleAPI.stylesheet === undefined) {
        styleAPI.stylesheet = document.createElement('style');
        styleAPI.stylesheet.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(styleAPI.stylesheet);
      }
      
      var curCSS = styleAPI.stylesheet.styleSheet ? styleAPI.stylesheet.styleSheet.cssText : styleAPI.stylesheet.innerHTML;
      
      if (styleAPI.tracker[name])
        //if already there, only update existing
        curCSS = curCSS.substr(0, styleAPI.tracker[name].startIndex - 1) + css + curCSS.substr(styleAPI.tracker[name].endIndex);
      
      else {
        //add styles and track the name position
        styleAPI.tracker[name] = {
          startIndex: curCSS.length,
          endIndex: curCSS.length + css.length - 1
        };
        
        curCSS += css;
      }
      
      if (styleAPI.stylesheet.styleSheet)
        styleAPI.stylesheet.styleSheet.cssText = curCSS;
      else
        styleAPI.stylesheet.innerHTML = curCSS;      
    },
    load: function(fileUrl, complete) {
      //dont load if already loaded
      if (styleAPI.tracker[fileUrl]) {
        complete();
        return;
      }
      text.get(fileUrl, function(css) {
        css = nomalize(css, fileUrl, baseUrl);
        styleAPI.inject(fileUrl, css);
        complete();
      });
    },
    clear: function() {
      for (var t in tracker)
        delete tracker[t];
      
      if (styleAPI.stylesheet.styleSheet)
        styleAPI.stylesheet.styleSheet.cssText = '';
      else
        styleAPI.stylesheet.innerHTML = '';
    }
  };
  
  var linkAPI = loaders.link = {
    links: {},
    load: function(fileUrl, complete) {
      //dont load if already loaded or loading
      if (linkAPI.links[fileUrl]) {
        if (linkAPI.links[fileUrl].loaded)
          complete();
        else {
          var onload = linkAPI.links[fileUrl].onload;
          linkAPI.links[fileUrl].onload = function() {
            complete();
            onload();
          }
        }
        return;
      }
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = fileUrl;
      link.onload = function() {
        link.loaded = true;
        complete();
      };
      document.getElementsByTagName('head')[0].appendChild(link);
      cssAPI.link.links[fileUrl] = link;
    },
    inject: function(name, css) {
      styleAPI.inject(name, css);
    },
    clear: function() {
      for (var l in linkAPI.links)
        document.getElementsByTagName('head')[0].removeChild(linkAPI.links[l]);
    }
  };
  
  var queueAPI = loaders.queue = {
    queue: {
      load: [],
      inject: []
    },
    load: function(fileUrl, complete) {
      queueAPI.queue.load.push([fileUrl, complete]);
    },
    inject: function(name, css) {
      queueAPI.queue.inject.push([name, css]);
    },
    clear: function() {
      queueAPI.queue.load = [];
      queueAPI.queue.inject = [];
    },
    flush: function(loader) {
      var loadQueue = queueAPI.queue.load;
      var injectQueue = queueAPI.queue.inject;
      for (var i = 0; i < loadQueue.length; i++)
        loader.load(loadQueue[0], loadQueue[1]);
      for (var i = 0; i < injectQueue.length; i++)
        loader.inject(injectQueue[0], injectQueue[1]);
    }
  };
  
  cssAPI.loader = require.isBrowser ? module.config().loader : 'buffer';
  
  //no loader given in config - need to do feature detection
  if (!loaders[cssAPI.loader]) {
    onLoadSupport(function(supported) {
      cssAPI.loader = support ? 'link' : 'style';
      queueAPI.flush(loaders[cssAPI.loader]);
    });
    //while support check is running, queue any requests
    cssAPI.loader = 'queue';
  }
  
  cssAPI.load = function(name, req, load, config) {
    //being used as a RequireJS plugin load
    if (name.substr(name.length - 5, 4) != '.css')
      name += '.css';
    loaders[cssAPI.loader].load(req.toUrl(name), function() {
      load(cssAPI);
    });
  };
  cssAPI.clear = function() {
    loaders[cssAPI.loader].clear();
  };
  cssAPI.inject = function(name, css) {
    loaders[cssAPI.loader].inject(name, css);
  };
  
  return cssAPI;
});
