define(['require', './normalize'], function(req, normalize) {
  var baseUrl = req.toUrl('.');
  
  var cssAPI = {};

  cssAPI.buffer = {};
  
  function compress(css) {
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      try {
        var csso = require.nodeRequire('csso');
        var csslen = css.length;
        css = csso.justDoIt(css);
        console.log('Compressed CSS output to ' + Math.round(css.length / csslen * 100) + '%.');
        return css;
      }
      catch(e) {
        console.log('Compression module not installed. Use "npm install csso -g" to enable.');
        return css;
      }
    }
    console.log('Compression not supported outside of nodejs environments.');
    return css;
  }
  
  //load file code - stolen from text plugin
  function loadFile(path) {
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      var fs = require.nodeRequire('fs');
      var file = fs.readFileSync(path, 'utf8');
      if (file.indexOf('\uFEFF') === 0)
        return file.substring(1);
      return file;
    }
    else {
      var encoding = "utf-8",
        file = new java.io.File(path),
        lineSeparator = java.lang.System.getProperty("line.separator"),
        input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
        stringBuffer, line,
        content = '';
      try {
        stringBuffer = new java.lang.StringBuffer();
        line = input.readLine();
        if (line && line.length() && line.charAt(0) === 0xfeff)
          line = line.substring(1);
        stringBuffer.append(line);
        while ((line = input.readLine()) !== null) {
          stringBuffer.append(lineSeparator);
          stringBuffer.append(line);
        }
        content = String(stringBuffer.toString());
      }
      finally {
        input.close();
      }
    }
  }
  
  
  function saveFile(path, data) {
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      var fs = require.nodeRequire('fs');
      fs.writeFileSync(path, data, 'utf8');
    }
    else {
      var encoding = "utf-8",
        file = new java.io.File(url),
        lineSeparator = java.lang.System.getProperty("line.separator"),
        output = new java.io.BufferedWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(file), encoding)),
        stringBuffer, line,
        content = '';
        
      throw "Rhino support for require-css isn't complete...";
      try {
        
        output.write(0xffef);
        output.write(data);
        
        //hmm... help! [Rhino support really isn't an issue but a niceity]
        /* stringBuffer = new java.lang.StringBuffer();
        
        stringBuffer.append(data);
        
        while ((line = ))
        
        output = input.readLine();

        // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
        // http://www.unicode.org/faq/utf_bom.html

        // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
        // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
        if (line && line.length() && line.charAt(0) === 0xfeff) {
            // Eat the BOM, since we've already found the encoding on this file,
            // and we plan to concatenating this buffer with others; the BOM should
            // only appear at the top of a file.
            line = line.substring(1);
        }

        stringBuffer.append(line);

        while ((line = input.readLine()) !== null) {
            stringBuffer.append(lineSeparator);
            stringBuffer.append(line);
        }
        //Make sure we return a JavaScript string and not a Java string.
        content = String(stringBuffer.toString()); //String */
      }
      finally {
        output.close();
      }
    }
  }
  
  //when adding to the link buffer, paths are normalised to the baseUrl
  //when removing from the link buffer, paths are normalised to the output file path
  function escape(content) {
    return content.replace(/(["'\\])/g, '\\$1')
      .replace(/[\f]/g, "\\f")
      .replace(/[\b]/g, "\\b")
      .replace(/[\n]/g, "\\n")
      .replace(/[\t]/g, "\\t")
      .replace(/[\r]/g, "\\r");
  }
  
  cssAPI.defined = {};
  
  //string hashing for naming css strings allowing for reinjection avoidance
  //courtesy of http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
  var djb2 = function(str) {
    var hash = 5381;
    for (i = 0; i < str.length; i++)
      hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    return hash;
  }
  
  cssAPI.inject = function(cssId, css, reinject) {
    if (css === undefined && reinject === undefined)
      cssId = djb2((css = cssId));
    else if (typeof css == 'boolean' && reinject === undefined) {
      reinject = css;
      css = cssId;
    }
    if (cssAPI.defined[cssId] !== undefined && !reinject)
      return;
    
    cssAPI.defined[cssId] = css;
    
    return cssId;
  }
  
  cssAPI.loadFile = function(cssId, complete, reload) {
    complete = complete || function(){};
    //nb despite the callback this version is synchronous to work with the write API
    //dont reload
    if (cssAPI.defined[cssId] !== undefined && !reload)
      return complete(cssAPI);
    
    var fileUrl = cssId;
    
    if (fileUrl.substr(fileUrl.length - 1, 1) == '!')
      fileUrl = fileUrl.substr(0, fileUrl.length - 1);
    
    if (fileUrl.substr(fileUrl.length - 4, 4) != '.css')
      fileUrl += '.css';
    
    fileUrl = req.toUrl(fileUrl);
    
    //external URLS don't get added (just like JS requires)
    if (fileUrl.substr(0, 7) == 'http://' || fileUrl.substr(0, 8) == 'https://')
      return complete(cssAPI);
    
    //add to the buffer
    var css = loadFile(fileUrl);
    css = normalize(css, fileUrl, baseUrl);
    cssAPI.inject(cssId, css);
    complete(cssAPI);
  }
  
  cssAPI.clear = function(cssId) {
    if (cssId)
      delete cssAPI.defined[cssId];
    else
      for (var o in cssAPI.defined)
        delete cssAPI.defined[o];
  }
  
  cssAPI.load = function(name, req, load, config) {
    //store config
    cssAPI.config = cssAPI.config || config;
    //just return - 'write' calls are made after exclusions so we run loading there
    load();
  }
  
  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 1, 1) == '!')
      return normalize(name.substr(0, name.length - 1)) + '!';
    return normalize(name);
  }
  
  //list of cssIds included in this layer
  var layerBuffer = [];
  
  cssAPI.write = function(pluginName, moduleName, write) {
    
    cssAPI.pluginName = cssAPI.pluginName || pluginName;
    
    if (moduleName.substr(0, 2) != '>>') {
      //(sync load)
      cssAPI.loadFile(moduleName);
      
      //ammend the layer buffer and write the module as a stub
      layerBuffer.push(moduleName);
      write.asModule(pluginName + '!' + moduleName, 'define(function(){})');
    }
    //buffer / write point
    else
      cssAPI.onLayerComplete(moduleName.substr(2), write);
  }
  
  cssAPI.onLayerComplete = function(name, write) {
    
    //separateCSS parameter set either globally or as a layer setting
    var separateCSS = false;
    if (cssAPI.config.separateCSS)
      separateCSS = true;
    if (cssAPI.config.modules)
      for (var i = 0; i < cssAPI.config.modules.length; i++)
        if (typeof cssAPI.config.modules[i].separateCSS == 'boolean')
          separateCSS = cssAPI.config.modules[i].separateCSS;
    
    //calculate layer css and index injection script
    var css = '';
    var index = '';
    for (var i = 0; i < layerBuffer.length; i++) {
      css += cssAPI.defined[layerBuffer[i]];
      index += 'defined[\'' + layerBuffer[i] + '\'] = ';
    }
    
    if (separateCSS) {
      if (typeof console != 'undefined' && console.log)
        console.log('Writing CSS! file: ' + name + '\n');
      
      //calculate the css output path for this layer
      var path = cssAPI.config.dir ? cssAPI.config.dir + name + '.css' : cssAPI.config.out.replace(/\.js$/, '.css');
      var output = compress(normalize(css, baseUrl, path));
      
      saveFile(path, output);
      
      //write the layer index into the layer
      write('require([\'' + cssAPI.pluginName + '\'], function(css) { \n'
        + 'var defined = css.defined; \n'
        + index + 'true; \n'
        + '});');
    }
    else {
      if (css == '')
        return;
      //write the injection and layer index into the layer
      
      //prepare the css
      css = escape(compress(css));
      
      //derive the absolute path for the normalize helper
      var normalizeParts = cssAPI.pluginName.split('/');
      normalizeParts[normalizeParts.length - 1] = 'normalize';
      var normalizeName = normalizeParts.join('/');
      
      write('require([\'' + cssAPI.pluginName + '\', \'' + normalizeName + '\', \'require\'], function(css, normalize, require) { \n'
        + 'var defined = css.defined; \n'
        + index + 'true; \n'
        + 'css.inject(normalize(\'' + css + '\', \'/\', require.toUrl(\'.\').substr(1))); \n'
        + '});');
    }
    
    //clear layer buffer for next layer
    layerBuffer = [];
  }
  
  return cssAPI;
});
