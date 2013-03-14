/*
 * css! loader plugin
 * Allows for loading stylesheets with the 'css!' syntax.
 *
 * Fully supports cross origin CSS loading.
 * 
 * Still to test:
 * iOS5
 * Android
 * Other devices
 *
 * Tested and working in (latest versions as of March 2013):
 * iOS6
 * IE6 - IE10
 * Chome 3 - 26
 * Firefox 3.5 - 19
 * Opera 10 - 12
 * 
 * Not working in:
 * Firefox 3.0
 * Chrome 2.0, 1.0
 * 
 * Thanks to browserling.com for virtual testing environment
 *
 * Credit to B Cavalier & J Hann for the elegant IE 6 - 9 hack.
 * 
 * Other sources that helped along the way:
 * - https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
 * - http://www.phpied.com/when-is-a-stylesheet-really-loaded/
 * - https://github.com/cujojs/curl/blob/master/src/curl/plugin/css.js
 *
 */

define(['./normalize', 'module'], function(normalize, module) {
  if (typeof window == 'undefined')
    return { load: function(n, r, load){ load() } };

  // set to true to enable test prompts for device testing
  var testing = false;
  
  var head = document.getElementsByTagName('head')[0];

  var engine = window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit\/([^ ;]*)|Opera\/([^ ;]*)|rv\:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)/);
  var hackLinks = false;

  if (!engine) {}
  else if (engine[1] || engine[7]) {
    hackLinks = (parseInt(engine[1]) < 6) || (parseInt(engine[7]) <= 9);
    engine = 'trident';
  }
  else if (engine[2]) {
    hackLinks = true;
    engine = 'webkit';
  }
  else if (engine[3]) {
    // engine = 'opera';
  }
  else if (engine[4]) {
    hackLinks = parseInt(engine[4]) < 18;
    engine = 'gecko';
  }
  else if (testing)
    alert('Engine detection failed');

  /* XHR code - copied from RequireJS text plugin */
  var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
  var fileCache = {};
  var get = function(url, callback, errback) {
    if (fileCache[url]) {
      callback(fileCache[url]);
      return;
    }

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
    
    xhr.open('GET', url, requirejs.inlineRequire ? false : true);
  
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
        else {
          fileCache[url] = xhr.responseText;
          callback(xhr.responseText);
        }
      }
    };
    
    xhr.send(null);
  }
  
  //main api object
  var cssAPI = {};
  
  cssAPI.pluginBuilder = './css-builder';
  
  //uses the <style> load method
  var stylesheet = document.createElement('style');
  stylesheet.type = 'text/css';
  head.appendChild(stylesheet);
  
  if (stylesheet.styleSheet)
    cssAPI.inject = function(css) {
      stylesheet.styleSheet.cssText += css;
    }
  else
    cssAPI.inject = function(css) {
      stylesheet.appendChild(document.createTextNode(css));
    }

  var webkitLoadCheck = function(link, callback) {
    setTimeout(function() {
      for (var i = 0; i < document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        if (sheet.href == link.href)
          return callback();
      }
      webkitLoadCheck(link, callback);
    }, 10);
  }

  var mozillaLoadCheck = function(style, callback) {
    setTimeout(function() {
      try {
        style.sheet.cssRules;
        return callback();
      } catch (e){}
      mozillaLoadCheck(style, callback);
    }, 10);
  }

  // ie link detection, as adapted from https://github.com/cujojs/curl/blob/master/src/curl/plugin/css.js
  if (engine == 'trident' && hackLinks) {
    var ieStyles = [],
      ieQueue = [],
      ieStyleCnt = 0;
    var ieLoad = function(url, callback) {
      var style;
      ieQueue.push({
        url: url,
        cb: callback
      });
      style = ieStyles.shift();
      if (!style && ieStyleCnt++ < 12) {
        style = document.createElement('style');
        head.appendChild(style);
      }
      ieLoadNextImport(style);
    }
    var ieLoadNextImport = function(style) {
      var curImport = ieQueue.shift();
      if (!curImport) {
        style.onload = noop;
        ieStyles.push(style);
        return;  
      }
      style.onload = function() {
        curImport.cb(curImport.ss);
        ieLoadNextImport(style);
      };
      var curSheet = style.styleSheet;
      curImport.ss = curSheet.imports[curSheet.addImport(curImport.url)];
    }
  }

  // uses the <link> load method
  var createLink = function(url) {
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = url;
    return link;
  }

  var noop = function(){}

  cssAPI.linkLoad = function(url, callback) {
    var timeout = setTimeout(function() {
      if (testing) alert('timeout');
      callback();
    }, waitSeconds * 1000 - 100);
    var _callback = function() {
      clearTimeout(timeout);
      if (link)
        link.onload = noop;
      // for style querying, a short delay still seems necessary
      setTimeout(callback, 7);
    }
    if (!hackLinks) {
      var link = createLink(url);
      link.onload = _callback;
      head.appendChild(link);
    }
    // hacks
    else {
      if (engine == 'webkit') {
        var link = createLink(url);
        webkitLoadCheck(link, _callback);
        head.appendChild(link);
      }
      else if (engine == 'gecko') {
        var style = document.createElement('style');
        style.textContent = '@import "' + url + '"';
        mozillaLoadCheck(style, _callback);
        head.appendChild(style);
      }
      else if (engine == 'trident')
        ieLoad(url, _callback);
    }
  }


  cssAPI.inspect = function() {
    if (stylesheet.styleSheet)
      return stylesheet.styleSheet.cssText;
    else if (stylesheet.innerHTML)
      return stylesheet.innerHTML;
  }
  
  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 4, 4) == '.css')
      name = name.substr(0, name.length - 4);
    
    return normalize(name);
  }

  // NB add @media query support for media imports
  var importRegEx = /@import\s*(url)?\s*(('([^']*)'|"([^"]*)")|\(('([^']*)'|"([^"]*)"|([^\)]*))\))\s*;?/g;

  var pathname = window.location.pathname.split('/');
  pathname.pop();
  pathname = pathname.join('/') + '/';

  var loadCSS = function(fileUrl, callback, errback) {

    //make file url absolute
    if (fileUrl.substr(0, 1) != '/')
      fileUrl = '/' + normalize.convertURIBase(fileUrl, pathname, '/');

    get(fileUrl, function(css) {

      // normalize the css (except import statements)
      css = normalize(css, fileUrl, pathname);

      // detect all import statements in the css and normalize
      var importUrls = [];
      var importIndex = [];
      var importLength = [];
      var match;
      while (match = importRegEx.exec(css)) {
        var importUrl = match[4] || match[5] || match[7] || match[8] || match[9];

        importUrls.push(importUrl);
        importIndex.push(importRegEx.lastIndex - match[0].length);
        importLength.push(match[0].length);
      }

      // load the import stylesheets and substitute into the css
      var completeCnt = 0;
      for (var i = 0; i < importUrls.length; i++)
        (function(i) {
          loadCSS(importUrls[i], function(importCSS) {
            css = css.substr(0, importIndex[i]) + importCSS + css.substr(importIndex[i] + importLength[i]);
            var lenDiff = importCSS.length - importLength[i];
            for (var j = i + 1; j < importUrls.length; j++)
              importIndex[j] += lenDiff;
            completeCnt++;
            if (completeCnt == importUrls.length) {
              callback(css);
            }
          }, errback);
        })(i);

      if (importUrls.length == 0)
        callback(css);
    }, errback);
  }
  
  var waitSeconds;
  var alerted = false;
  cssAPI.load = function(cssId, req, load, config, parse) {
    waitSeconds = waitSeconds || config.waitSeconds || 7;

    var fileUrl = cssId;
    
    if (fileUrl.substr(fileUrl.length - 4, 4) != '.css' && !parse)
      fileUrl += '.css';
    
    fileUrl = req.toUrl(fileUrl);

    // determine if it is the same domain or not
    var sameDomain = true,
    domainCheck = /^(\w+:)?\/\/([^\/]+)/.exec(fileUrl);
    if (domainCheck) {
      sameDomain = domainCheck[2] === window.location.host;
      if (domainCheck[1])
        sameDomain &= domainCheck[1] === window.location.protocol;
    }
    
    // links
    if (!parse) {
      if (!alerted && testing)
        alert(hackLinks ? 'hacking links' : 'not hacking');
      alerted = true;
      cssAPI.linkLoad(fileUrl, function() {
        load(cssAPI);
      });
    }
    // style injection (always used for parsers)
    else {
      if (fileUrl.indexOf('.less') === -1 && parse)
        fileUrl += '.less';
      loadCSS(fileUrl, function(css) {
        // run parsing last - since less is a CSS subset this works fine
        if (parse)
          css = parse(css);

        cssAPI.inject(css);

        load(cssAPI);
      }, load.error);
    }
  }
  
  return cssAPI;
});
