/*
 * <link> element onLoad support detection
 *
 * Running the returned function will execute the test.
 *
 * The complete function is executed with the result of the test (true / false)
 *
 * Source:
 *  https://github.com/VIISON/RequireCSS/blob/master/css.js
 *
 */


define(function() {
  
  var linkSupport;
  
  /* Feature Detection */
  return function(complete) {
    if (linkSupport !== undefined)
      return linkSupport;
    
    if (typeof window == 'undefined')
      return false;
    
    // ie 6 & 7 lack data-uri support but have the link onload event
    if (navigator.userAgent.match(/MSIE ([67]{1,}[\.0-9]{0,})/)) {
      linkSupport = true;
      complete(true);
    }
    
    var head = document.getElementsByTagName('head')[0];
  
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = 'data:text/css,';
  
    link.onload = function () {
      linkSupport = true;
      complete(true);
    }
  
    head.appendChild(link);
  
    setTimeout(function () {
      head.removeChild(link);
      if (linkSupport !== true) {
        complete(false);
        linkSupport = false;
      }
    }, 0);
  }
  
  
 /*
  * Browser Detection
  * Browser sniffing for:
  * -IE 6+
  * -Chrome 19+
  * -Firefox 9+
  * -Opera
  *
  * No mobile support currently known of (iOS Safari and Chrome both failed testing)
  *
  * Sources:
  *  https://bugs.webkit.org/show_bug.cgi?id=38995
  *  https://bugzilla.mozilla.org/show_bug.cgi?id=185236
  *  https://developer.mozilla.org/en-US/docs/HTML/Element/link#Stylesheet_load_events
  
  
  //check we're in a browser
  if (typeof navigator == 'undefined')
    return false;
  
  //check for IE 6+
  var re = navigator.userAgent.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/);
  if (re && re[1] && parseFloat(re[1]) >= 6)
    return true;
  
  //check for Chrome 19+
  var re = navigator.appVersion.match(/Chrome\/(\d+)\./);
  if (re && re[1] && parseInt(re[1], 10) >= 19)
    return true;
  
  //check for Firefox 9+
  var re = navigator.userAgent.match(/Firefox\/(\d+)\./);
  if (re && re[1] && parseInt(re[1], 10) >= 9)
    return true;
  
  //check for Opera
  if (navigator.userAgent.indexOf("Opera") != -1)
    return true;
  
  return false;
  */
  
});