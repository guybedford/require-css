var parseModuleName = require('./parse-module-path');

/**
 * Get the transformed CSS from a given CSS file URL
 */
var transformedCss = exports = module.exports = function (req, loadModule, transformModuleNames, moduleName, callback) {
    var parsed = parseModuleName(moduleName);
    // TODO: move into parseModuleName
    var cssModule = parsed.cssId + '.css';
    // Load file URL as string
    loadModule(cssModule, function (cssStr) {
        var transformedCss = cssStr;
        req(transformModuleNames, function () {
            var transforms = [].slice.call(arguments);
            transforms.forEach(function (transform) {
                transformedCss = transform(transformedCss, parsed.params);
            });
            callback(transformedCss);
        });
    });
};

/**
 * Get an array of module names to load, each of which will
 * export a function that transforms a css string
 * @param key {string} 'requirejs' or 'node'
 */
exports.getTransformEaches = function getTransformEaches(config, key) {
    var cssConfig = config.css || {};
    var transformEaches = cssConfig.transformEach;
    if ( ! (transformEaches instanceof Array)) {
      transformEaches = [transformEaches];
    }
    var transforms = transformEaches.map(function (transformEach) {
      // It could just be a function to use for all platforms
      if (typeof transformEach === 'function' || typeof transformEach === 'string') {
        return transformEach;
      }
      // or it could be an object with requirejs and node keys
      var keyed = transformEach[key];
      if (keyed) {
        return keyed;
      }
      // dont support this
      throw new Error("Couldn't extract transform from " + transformEach);
    });
    return transforms;
};
