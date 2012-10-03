define(['require', './normalize'], function(req, normalize) {
  var baseUrl = req.toUrl('.');
  
  var cssAPI = {};
  
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
  
  //nb can remove server injection API
  cssAPI.set = function(cssId, css, reinject) {
    //if (css === undefined && reinject === undefined)
    //  cssId = djb2((css = cssId));
    /*else */if (typeof css == 'boolean' && reinject === undefined) {
      reinject = css;
      css = cssId;
    }
    if (this.defined[cssId] !== undefined && !reinject)
      return;
    
    this.defined[cssId] = css;
    
    return cssId;
  }
  
  cssAPI.loadFile = function(cssId, parse) {
    //nb despite the callback this version is synchronous to work with the write API
    //dont reload
    if (this.defined[cssId] !== undefined)
      return;
    
    var fileUrl = cssId;
    
    if (fileUrl.substr(fileUrl.length - 1, 1) == '!')
      fileUrl = fileUrl.substr(0, fileUrl.length - 1);
    
    if (fileUrl.substr(fileUrl.length - 4, 4) != '.css' && !parse)
      fileUrl += '.css';
    
    fileUrl = req.toUrl(fileUrl);
    
    //external URLS don't get added (just like JS requires)
    if (fileUrl.substr(0, 7) == 'http://' || fileUrl.substr(0, 8) == 'https://')
      return;
    
    //add to the buffer
    var css = loadFile(fileUrl);
    if (parse)
      css = parse(css);
    css = normalize(css, fileUrl, baseUrl);
    this.set(cssId, css);
  }
  
  /* cssAPI.clear = function(cssId) {
    if (cssId)
      delete cssAPI.defined[cssId];
    else
      for (var o in cssAPI.defined)
        delete cssAPI.defined[o];
  } */
  
  cssAPI.load = function(name, req, load, config) {
    //store config
    this.config = this.config || config;
    //just return - 'write' calls are made after exclusions so we run loading there
    load();
  }
  
  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 1, 1) == '!')
      return normalize(name.substr(0, name.length - 1)) + '!';
    return normalize(name);
  }
  
  //list of cssIds included in this layer
  cssAPI._layerBuffer = [];
  
  cssAPI.write = function(pluginName, moduleName, write, parse) {
    //external URLS don't get added (just like JS requires)
    if (moduleName.substr(0, 7) == 'http://' || moduleName.substr(0, 8) == 'https://')
      return;
    
    if (moduleName.substr(moduleName.length - 1, 1) == '!')
      moduleName = moduleName.substr(0, moduleName.length - 1);
    
    //(sync load)
    this.loadFile(moduleName, parse);
    
    //ammend the layer buffer and write the module as a stub
    this._layerBuffer.push(moduleName);
    
    write.asModule(pluginName + '!' + moduleName, 'define(function(){})');
  }
  
  //string hashing used to name css that doesnt have an id (which is the case for builds)
  //courtesy of http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
  var djb2 = function(str) {
    var hash = 5381;
    for (i = 0; i < str.length; i++)
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    return hash;
  }
  
  cssAPI.onLayerEnd = function(write, data) {
    //separateCSS parameter set either globally or as a layer setting
    var separateCSS = false;
    if (this.config.separateCSS)
      separateCSS = true;
    if (this.config.modules)
      for (var i = 0; i < this.config.modules.length; i++)
        if (typeof this.config.modules[i].separateCSS == 'boolean')
          separateCSS = this.config.modules[i].separateCSS;
    
    //calculate layer css and index injection script
    var css = '';
    var index = '';
    for (var i = 0; i < this._layerBuffer.length; i++) {
      css += this.defined[this._layerBuffer[i]];
      index += 'defined[\'' + this._layerBuffer[i] + '\'] = ';
    }
    
    if (separateCSS) {
      if (typeof console != 'undefined' && console.log)
        console.log('Writing CSS! file: ' + data.name + '\n');
      
      //calculate the css output path for this layer
      var path = this.config.dir ? this.config.dir + data.name + '.css' : this.config.out.replace(/\.js$/, '.css');
      var output = compress(normalize(css, baseUrl, path));
      
      saveFile(path, output);
      
      //write the layer index into the layer
      write('require([\'css\'], function(css) { \n'
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
      var normalizeParts = req.toUrl('css').substr(baseUrl.length - 1).split('/');
      normalizeParts[normalizeParts.length - 1] = 'normalize';
      var normalizeName = normalizeParts.join('/');
      
      write('require([\'css\', \'' + normalizeName + '\', \'require\'], function(css, normalize, require) { \n'
        + 'var defined = css.defined; \n'
        + 'var baseUrl = require.toUrl(\'.\'); \n'
        + 'baseUrl = baseUrl.substr(0, 1) == \'.\' ? baseUrl.substr(1) : baseUrl; \n'
        + index + 'true; \n'
        + 'css.set(\'' + djb2(css) + '\', normalize(\'' + css + '\', \'/\', baseUrl)); \n'
        + '});');
    }
    
    //clear layer buffer for next layer
    layerBuffer = [];
  }
  
  return cssAPI;
});
