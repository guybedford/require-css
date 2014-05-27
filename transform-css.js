var parseModuleName = require('./parse-module-path');

/**
 * Get the transformed CSS from a given CSS file URL
 * 
 */
var transformedCss = module.exports = function (req, loadFile, getTransforms, moduleName, callback) {
    var parsed = parseModuleName(moduleName);
    // TODO: move into parseModuleName
    var cssModule = parsed.cssId + '.css';
    var cssUrl = req.toUrl(cssModule);
    var transformedCss;
    // Load file URL as string
    loadFile(cssUrl, function (cssStr) {
        var transformedCss = cssStr;
        var transformModuleNames = getTransforms();
        req(transformModuleNames, function () {
            var transforms = [].slice.call(arguments);
            transforms.forEach(function (transform) {
                transformedCss = transform(transformedCss, parsed.params);
            });
            callback(transformedCss);
        });
    });
}