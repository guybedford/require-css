/*
 * Require-CSS RequireJS css! loader plugin
 * 0.1.2
 * Guy Bedford 2013
 * MIT
 */

/*
 *
 * Usage:
 *  require(['css!./mycssFile']);
 *
 * Tested and working in (up to latest versions as of March 2013):
 * Android
 * iOS 6
 * IE 6 - 10
 * Chome 3 - 26
 * Firefox 3.5 - 19
 * Opera 10 - 12
 * 
 * browserling.com used for virtual testing environment
 *
 * Credit to B Cavalier & J Hann for the IE 6 - 9 method,
 * refined with help from Martin Cermak
 * 
 * Sources that helped along the way:
 * - https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
 * - http://www.phpied.com/when-is-a-stylesheet-really-loaded/
 * - https://github.com/cujojs/curl/blob/master/src/curl/plugin/css.js
 *
 */

define(['./parse-module-path', './transform-css'], function(parseModulePath, getTransformedCss) {
//>>excludeStart('excludeRequireCss', pragmas.excludeRequireCss)
  if (typeof window == 'undefined')
    return { load: function(n, r, load){ load() } };

  var head = document.getElementsByTagName('head')[0];

  var engine = window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit\/([^ ;]*)|Opera\/([^ ;]*)|rv\:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)/) || 0;

  // use <style> @import load method (IE < 9, Firefox < 18)
  var useImportLoad = false;
  
  // set to false for explicit <link> load checking when onload doesn't work perfectly (webkit)
  var useOnload = true;

  // trident / msie
  if (engine[1] || engine[7])
    useImportLoad = parseInt(engine[1]) < 6 || parseInt(engine[7]) <= 9;
  // webkit
  else if (engine[2])
    useOnload = false;
  // gecko
  else if (engine[4])
    useImportLoad = parseInt(engine[4]) < 18;
  
//>>excludeEnd('excludeRequireCss')
  //main api object
  var cssAPI = {};

//>>excludeStart('excludeRequireCss', pragmas.excludeRequireCss)
  cssAPI.pluginBuilder = './css-builder';

  // <style> @import load method
  var curStyle, curSheet;
  var createStyle = function () {
    curStyle = document.createElement('style');
    head.appendChild(curStyle);
    curSheet = curStyle.styleSheet || curStyle.sheet;
  }
  var ieCnt = 0;
  var ieLoads = [];
  var ieCurCallback;
  
  var createIeLoad = function(url) {
    ieCnt++;
    if (ieCnt == 32) {
      createStyle();
      ieCnt = 0;
    }
    curSheet.addImport(url);
    curStyle.onload = processIeLoad;
  };
  var processIeLoad = function() {
    ieCurCallback();
 
    var nextLoad = ieLoads.shift();
 
    if (!nextLoad) {
      ieCurCallback = null;
      return;
    }
 
    ieCurCallback = nextLoad[1];
    createIeLoad(nextLoad[0]);
  }
  var importLoad = function(url, callback) {
    if (!curSheet || !curSheet.addImport)
      createStyle();

    if (curSheet && curSheet.addImport) {
      // old IE
      if (ieCurCallback) {
        ieLoads.push([url, callback]);
      }
      else {
        createIeLoad(url);
        ieCurCallback = callback;
      }
    }
    else {
      // old Firefox
      curStyle.textContent = '@import "' + url + '";';

      var loadInterval = setInterval(function() {
        try {
          curStyle.sheet.cssRules;
          clearInterval(loadInterval);
          callback();
        } catch(e) {}
      }, 10);
    }
  };

  // <link> load method
  var linkLoad = function(url, callback) {
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    if (useOnload)
      link.onload = function() {
        link.onload = function() {};
        // for style dimensions queries, a short delay can still be necessary
        setTimeout(callback, 7);
      }
    else
      var loadInterval = setInterval(function() {
        for (var i = 0; i < document.styleSheets.length; i++) {
          var sheet = document.styleSheets[i];
          if (sheet.href == link.href) {
            clearInterval(loadInterval);
            return callback();
          }
        }
      }, 10);
    link.href = url;
    head.appendChild(link);
  }

  // insert a string of css in the page via textNode of style element
  var insertCss = function (cssStr) {
      var styleEl=document.createElement('style');
      styleEl.type='text/css';
      if (styleEl.styleSheet) {
        styleEl.styleSheet.cssText = cssStr;
      } else {
        styleEl.appendChild(document.createTextNode(cssStr));
      }
      document.getElementsByTagName('head')[0].appendChild(styleEl);
  };

//>>excludeEnd('excludeRequireCss')
  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 4, 4) == '.css')
      name = name.substr(0, name.length - 4);

    return normalize(name);
  }

  // This is the last one included when excludeRequireCss is true
  cssAPI.load = function(cssId, req, load) {
    load();
  };

//>>excludeStart('excludeRequireCss', pragmas.excludeRequireCss)

  // load a file url and get the contents as a string
  function loadModule(require, module, callback) {
    var textModule = 'text!' + module;
    require([textModule], function () {
      callback.apply(this, arguments);
    });
  }

  cssAPI.load = function(cssId, req, load, config) {
    getTransformedCss(
      req,
      loadModule.bind({}, req),
      getTransformedCss.getTransformEaches(config, 'requirejs'),
      cssId,
      withTransformedCss
      );
    function withTransformedCss(cssStr) {
      insertCss(cssStr);
      load();
    }
  }

//>>excludeEnd('excludeRequireCss')
  return cssAPI;
});
