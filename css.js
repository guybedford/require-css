/*
 * Require-CSS RequireJS css! loader plugin
 * 0.1.8
 * Guy Bedford 2014
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

define(function () {
	if (typeof window === 'undefined') {
		return {
			load: function (n, r, load) {
				load();
			}
		};
	}

	var head = document.getElementsByTagName('head')[0];

	var engine = window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit[\/|5]([^ ;]*)|Opera\/([^ ;]*)|rv:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)|AndroidWebKit\/([^ ;]*)/) || 0;

	// use <style> @import load method (IE < 9, Firefox < 18)
	var useImportLoad = false;

	// set to false for explicit <link> load checking when onload doesn't work perfectly (webkit)
	var useOnload = true;

	// trident / msie
	if (engine[1] || engine[7]) {
		useImportLoad = parseInt(engine[1], 10) < 6 || parseInt(engine[7], 10) <= 9;
		// webkit
	} else if (engine[2] || engine[8]) {
		useOnload = false;
		// gecko
	} else if (engine[4]) {
		useImportLoad = parseInt(engine[4], 10) < 18;
	}

	// main api object
	var cssAPI = {};

	cssAPI.pluginBuilder = './css-builder';

	// <style> @import load method
	var curStyle;
	var curSheet;
	var createStyle = function (module) {
		curStyle = document.createElement('style');
		curStyle.setAttribute('data-requiremodule', module);
		head.appendChild(curStyle);
		curSheet = curStyle.styleSheet || curStyle.sheet;
	};
	var ieCnt = 0;
	var ieLoads = [];
	var ieCurCallback;
	var createIeLoad = function (url, module) {
		curSheet.addImport(url + '?' + Math.random());
		curStyle.onload = function () {
			processIeLoad(module);
		};

		ieCnt++;
		if (ieCnt === 31) {
			createStyle(module);
			ieCnt = 0;
		}
	};
	var processIeLoad = function (module) {
		ieCurCallback();

		var nextLoad = ieLoads.shift();

		if (!nextLoad) {
			ieCurCallback = null;
			return;
		}

		ieCurCallback = nextLoad[1];
		createIeLoad(nextLoad[0], module);
	};
	var importLoad = function (url, module, callback) {
		if (!curSheet || !curSheet.addImport) {
			createStyle(module);
		}

		if (curSheet && curSheet.addImport) {
			// old IE
			if (ieCurCallback) {
				ieLoads.push([url, callback]);
			} else {
				createIeLoad(url, module);
				ieCurCallback = callback;
			}
		} else {
			// old Firefox
			curStyle.textContent = '@import "' + url + '";';

			var loadInterval = setInterval(function () {
				try {
					curStyle.sheet.cssRules;
					clearInterval(loadInterval);
					callback();
				} catch (err) {}
			}, 10);
		}
	};

	// <link> load method
	var linkLoad = function (url, module, callback) {
		var link = document.createElement('link');
		link.setAttribute('data-requiremodule', module);
		link.type = 'text/css';
		link.rel = 'stylesheet';
		if (useOnload) {
			link.onload = function () {
				link.onload = function () {};
				// for style dimensions queries, a short delay can still be necessary
				setTimeout(callback, 7);
			};
		} else {
			var loadInterval = setInterval(function () {
				for (var i = 0; i < document.styleSheets.length; i++) {
					var sheet = document.styleSheets[i];
					if (sheet.href === link.href) {
						clearInterval(loadInterval);
						return callback();
					}
				}
			}, 10);
		}
		link.href = url;
		head.appendChild(link);
	};

	cssAPI.normalize = function (name, normalize) {
		if (name.substr(name.length - 4, 4) === '.css') {
			name = name.substr(0, name.length - 4);
		}
		return normalize(name);
	};

	cssAPI.load = function (cssId, req, load) {
		(useImportLoad ? importLoad : linkLoad)(req.toUrl(cssId + '.css'), cssId, load);
	};

	return cssAPI;
});
