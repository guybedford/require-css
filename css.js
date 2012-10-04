/*
 * css! loader plugin
 * Allows for loading stylesheets with the 'css!' syntax.
 *
 * External stylesheets supported.
 *
 * API:
 * css.set(cssId, css)
 * (disabled) css.set(css) (returns an id that can be used with clear)
 * (disabled) css.clear(cssId)
 * (disabled) css.clear()
 * 
 * '!' suffix skips load checking
 *
 */
define(['require', './normalize'], function(require, normalize) {
  
  if (typeof window == 'undefined')
    return null;
  
  var baseUrl = require.toUrl('.');
  var head = document.getElementsByTagName('head')[0];
  
  
  /* XHR code - copied from RequireJS text plugin */
  var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
  var get = function(url, callback, errback) {
  
    var xhr, i, progId;
    if (typeof XMLHttpRequest !== 'undefined')
      xhr = new XMLHttpRequest();
    else if (typeof ActiveXObject !== 'undefined')
      for (i = 0; i < 3; i += 1) {
        progId = progIds[i];
        try {
          xhr = new ActiveXObject(progId);
        }
        catch (e) {}
  
        if (xhr) {
          progIds = [progId];  // so faster next time
          break;
        }
      }
    
    xhr.open('GET', url, true);
  
    xhr.onreadystatechange = function (evt) {
      var status, err;
      //Do not explicitly handle errors, those should be
      //visible via console output in the browser.
      if (xhr.readyState === 4) {
        status = xhr.status;
        if (status > 399 && status < 600) {
          //An http 4xx or 5xx error. Signal an error.
          err = new Error(url + ' HTTP status: ' + status);
          err.xhr = xhr;
          errback(err);
        }
        else
          callback(xhr.responseText);
      }
    };
    
    xhr.send(null);
  }
  
  //main api object
  var cssAPI = {};
  
  cssAPI.pluginBuilder = './css-builder';
  
  //used to track all css injections
  cssAPI.defined = {};
  //track loads to allow for cancelling
  //cssAPI.loading = {};
  //link tags used for external stylesheets
  cssAPI.links = {};
  
  //<style> tag creation, setters and getters
  var stylesheet;
  var createStyle = function() {
    //create stylesheet if necessary
    if (stylesheet === undefined) {
      stylesheet = document.createElement('style');
      stylesheet.type = 'text/css';
      head.appendChild(stylesheet);
    }
  }
  var setStyle = function(css) {
    createStyle();
    if (stylesheet.styleSheet)
      stylesheet.styleSheet.cssText = css;
    else
      stylesheet.innerHTML = css;
  }
  var getStyle = function() {
    createStyle();
    return stylesheet.styleSheet ? stylesheet.styleSheet.cssText : stylesheet.innerHTML;
  }
  
  //string hashing for naming css strings allowing for reinjection avoidance
  //courtesy of http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
  /* var djb2 = function(str) {
    var hash = 5381;
    for (i = 0; i < str.length; i++)
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    return hash;
  } */
  
  //public API methods
  cssAPI.set = function(cssId, css) {
    /* if (css === undefined)
      cssId = djb2((css = cssId)); */
    
    var curCSS = getStyle();
    
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
    
    setStyle(curCSS);
      
    return cssId;
  }
  
  //useful for debugging to see the css by cssId
  /* cssAPI.get = function(cssId) {
    var curCSS = getStyle();
    
    if (!cssId)
      return curCSS;
    
    var def;
    //if already there, so we can get
    if ((def = cssAPI.defined[cssId]) && typeof def.index == 'number')
      return curCSS.substr(def.index, def.length);
    else
      return null;
  } */
  
  /* cssAPI.clear = function(cssId) {
    if (cssId) {
      if (cssAPI.defined[cssId]) {
        cssAPI.set(cssId, '');
        delete cssAPI.defined[cssId];
      }
      if (cssAPI.loading[cssId])
        delete cssAPI.loading[cssId];
      if (cssAPI.links[cssId]) {
        head.removeChild(cssAPI.links[cssId]);
        delete cssAPI.links[cssId];
      }
    }
    else {
      for (var l in cssAPI.links[cssId])
        head.removeChild(cssAPI.links[l]);
      setStyle('');
      cssAPI.loading = {};
      cssAPI.defined = {};
      cssAPI.links = {};
    }
  } */
  
  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 1, 1) == '!')
      return normalize(name.substr(0, name.length - 1)) + '!';
    return normalize(name);
  }
  
  cssAPI.load = function(cssId, req, load, config, parse) {
    var skipLoad = false;
    if (cssId.substr(cssId.length - 1, 1) == '!') {
      cssId = cssId.substr(0, cssId.length - 1);
      skipLoad = true;
    }
    if (cssAPI.defined[cssId])
      return load(cssAPI);
    
    var fileUrl = cssId;
    
    if (fileUrl.substr(fileUrl.length - 4, 4) != '.css' && !parse)
      fileUrl += '.css';
    
    fileUrl = req.toUrl(fileUrl);
    
    //external url -> add as a <link> tag to load. onload support not reliable so not provided
    if (fileUrl.substr(0, 7) == 'http://' || fileUrl.substr(0, 8) == 'https://') {
      if (parse)
        throw 'Cannot preprocess external css.';
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = fileUrl;
      head.appendChild(link);
      
      //only instant callback due to onload not being reliable
      cssAPI.links[cssId] = link;
      load(cssAPI);
    }
    //internal url -> download and inject into <style> tag
    else {
      //cssAPI.loading[cssId] = true;
      get(fileUrl, function(css) {
        //if (!cssAPI.loading[cssId]) //if load is cancelled, ignore
        //  return;
        
        if (parse)
          css = parse(css);
        css = normalize(css, fileUrl, baseUrl);
        cssAPI.set(cssId, css);
          
        if (!skipLoad)
          load(cssAPI);
      });
      if (skipLoad)
        load(cssAPI);
    }
  }
  
  return cssAPI;
});
