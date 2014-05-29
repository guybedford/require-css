/**
 * Prefix every rule in the in css string
 * with an attribute selector that targets only
 * elements in Components created from THIS version
 * of the module
 */
module.exports = function (packageJson, rework, css, params) {
    params = params || {};
    // You have to opt into prefixing
    if ( ! ('prefix' in params)) {
        return css;
    }
    // Unless specified with params.prefix, prefix all css rules with
    // [data-lf-module="streamhub-wall#VERSION"]
    var prefix = params.prefix;
    if ( ! prefix) {
        prefix = attrSelector('data-lf-module', packageName(packageJson));
    }
    if ( ! prefix) {
        return css;
    }
    console.log('prefixing css');
    var prefixedCss = rework(css)
        .use(rework.prefixSelectors(prefix))
        .toString();
    return prefixedCss;
};

function attrSelector(attr, value) {
    var selector = '[{attr}="{value}"]'
        .replace('{attr}', attr)
        .replace('{value}', value);
    return selector;
}

function packageName(packageJson) {
    return packageJson.name + '#' + packageJson.version;
}