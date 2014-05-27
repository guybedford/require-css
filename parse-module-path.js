/**
 * The moduleId after css! can have params prefixed, and the params will
 * be passed to transform functions e.g.
 * Params will only be parsed if they start with '?'
 * in: 'css!?prefix=[data-lf-module=streamhub-wall#3.0.0]:./styles/wall-component.css'
 * out: { params: { prefix: '[data-...', cssId: './styles/wall-...' }}
 */
var cssIdParamsPattern = /^\?([^:]+)\:(.*)/;

/**
 * in: 'blah=foo&bar:module/path'
 * out: { cssId: 'module/path',
 *        params: { blah: 'foo', bar: undefined } }
 */
var parseCssId = module.exports = function (cssId) {
  var paramPatternMatch = cssId.match(cssIdParamsPattern);
  if ( ! paramPatternMatch) {
    return parsedObj(cssId);
  }
  var paramsStr = paramPatternMatch[1];
  var cssId = paramPatternMatch[2];
  return parsedObj(cssId, paramsStrToObj(paramsStr));
}

function parsedObj(cssId, params) {
  return {
    cssId: cssId,
    params: params
  };
}

/**
 * in: 'blah=foo&bar'
 * out: { blah: 'foo', bar: undefined }
 */
function paramsStrToObj(paramsStr) {
  var paramParts = paramsStr.split('&');
  var param;
  var key;
  var val;
  var paramsObj = {};
  for (var i=0; i < paramParts.length; i++) {
    param = paramParts[i].split('=');
    key = param[0];
    val = (param.length > 1 ? unescape(param.slice(1).join('=')) : undefined);
    paramsObj[key] = val;
  }
  return paramsObj;
}
