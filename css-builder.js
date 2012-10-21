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
  
  var loadCSS = function(cssId, parse) {
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
    
    return css;
  }
  
  cssAPI.load = function(name, req, load, config) {
    //store config
    cssAPI.config = cssAPI.config || config;
    //just return - 'write' calls are made after exclusions so we run loading there
    load();
  }
  
  cssAPI.normalize = function(name, normalize) {
    var separate = name.substr(name.length - 1, 1) == '!';
    if (separate)
      name = name.substr(0, name.length - 1);
    if (name.substr(name.length - 4, 4) == '.css')
      name = name.substr(0, name.length - 4);
    return normalize(name);
  }
  
  //list of cssIds included in this layer
  var _layerBuffer = [];
  
  cssAPI.write = function(pluginName, moduleName, write, parse) {
    //external URLS don't get added (just like JS requires)
    if (moduleName.substr(0, 7) == 'http://' || moduleName.substr(0, 8) == 'https://')
      return;
    
    if (moduleName.substr(moduleName.length - 1, 1) == '!')
      moduleName = moduleName.substr(0, moduleName.length - 1);
    
    //ammend the layer buffer and write the module as a stub
    _layerBuffer.push(loadCSS(moduleName, parse));
    
    write.asModule(pluginName + '!' + moduleName, 'define(function(){})');
  }
  
  cssAPI.onLayerEnd = function(write, data) {
    //separateCSS parameter set either globally or as a layer setting
    var separateCSS = false;
    if (cssAPI.config.separateCSS)
      separateCSS = true;
    if (cssAPI.config.modules)
      for (var i = 0; i < cssAPI.config.modules.length; i++)
        if (typeof cssAPI.config.modules[i].separateCSS == 'boolean')
          separateCSS = cssAPI.config.modules[i].separateCSS;
    
    //calculate layer css
    var css = _layerBuffer.join('');
    
    if (separateCSS) {
      if (typeof console != 'undefined' && console.log)
        console.log('Writing CSS! file: ' + data.name + '\n');
      
      //calculate the css output path for this layer
      var path = this.config.dir ? this.config.dir + data.name + '.css' : cssAPI.config.out.replace(/\.js$/, '.css');
      var output = compress(normalize(css, baseUrl, path));
      
      saveFile(path, output);
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
        + 'var baseUrl = require.toUrl(\'.\'); \n'
        + 'baseUrl = baseUrl.substr(0, 1) == \'.\' ? baseUrl.substr(1) : baseUrl; \n'
        + 'css.inject(normalize(\'' + css + '\', \'/\', baseUrl)); \n'
        + '});');
    }
    
    //clear layer buffer for next layer
    _layerBuffer = [];
  }
  
  return cssAPI;
});
