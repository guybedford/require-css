define(['text'], function(text) {
  var css = {};
  
  css.pluginBuilder = 'require-css/css-optimize';
  
  css.stylesheet = undefined;

  //adds a css string to the page
  css.add = function(newCSS) {
    
    //no link element - create
    if (css.stylesheet === undefined) {
      css.stylesheet = document.createElement('style');
      css.stylesheet.setAttribute('type', 'text/css');
      document.getElementsByTagName('head')[0].appendChild(css.stylesheet);
    }
    
    css.stylesheet.innerHTML += newCSS;
  }

  css.load = function(name, req, load, config) {
    
    req(['text!' + name + '.css'], function(rawCSS) {
      
      //add css to the local css buffer
      css.add(rawCSS);
      
      load(null);
    });
  };
  
  return css;
});
