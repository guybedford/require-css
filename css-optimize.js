define(['text'], function(text) {
  var css = {};
  
  css.buffer = '';
  css.bufferCount = 0;
  css.writeCount = 0;
  
  css.process = function(css) {
    
    return css.replace(/(['\\])/g, '\\$1')
        .replace(/[\f]/g, "\\f")
        .replace(/[\b]/g, "\\b")
        .replace(/[\n]/g, "\\n")
        .replace(/[\t]/g, "\\t")
        .replace(/[\r]/g, "\\r");
    //return text.jsEscape(css);
  };
  
  css.load = function(name, req, load, config) {
    
    text.get(req.toUrl(name + '.css'), function(rawCSS) {
      css.buffer += css.process(rawCSS);
      css.bufferCount++;
      load(null);
    });
    
  };
  
  css.write = function(pluginName, moduleName, write) {
    //dummy define for each css inclusion
    write.asModule(pluginName + "!" + moduleName, "define(function(){return null;}); \n");
    css.writeCount++;
    
    //when on the last write, dump the full buffer in
    if (css.writeCount == css.bufferCount)
      write("(function() { \n" +
            "  var style = document.createElement('style'); \n" +
            "  style.setAttribute('type', 'text/css'); \n" +
            "  style.innerHTML = \"" + css.buffer + "\"; \n" +
            "  document.getElementsByTagName('head')[0].appendChild(style); \n" +
            "})();");
  };
  
  return css;
});
