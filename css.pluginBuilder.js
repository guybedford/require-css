define(['require', './normalize'], function(req, normalize) {
  var baseUrl = req.toUrl('.');
  
  var cssAPI = {};

  cssAPI.buffer = {};
  
  //todo: include compression with redundancy
  function compress(css) {
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
  
  cssAPI.stubs = [];
  
  cssAPI.load = function(name, req, load, config) {
    //store config
    cssAPI.config = cssAPI.config || config;
    //just return - 'write' calls are made after exclusions so we run loading there
    load();
  }
  
  cssAPI.write = function(pluginName, moduleName, write) {
    if (moduleName.substr(0, 2) != '>>') {
      
      var fileName = moduleName;
      
      if (fileName.substr(fileName.length - 5, 4) != '.cs')
        fileName += '.css';
      
      fileName = req.toUrl(fileName);
      
      //external URLS don't get added (just like JS)
      if (fileName.substr(0, 7) == 'http://' || fileName.substr(0, 8) == 'https://')
        return;
      
      //add to the buffer
      var css = loadFile(fileName);
      css = normalize(css, fileName, baseUrl);
      cssAPI.inject(fileName, css);
      
      //write as a stub
      cssAPI.stubs.push(pluginName + '!' + moduleName);
      cssAPI.pluginName = cssAPI.pluginName || pluginName;
    }
    
    //buffer / write point
    else
      cssAPI.onLayerComplete(moduleName.substr(2), write);
  }
  
  cssAPI.onLayerComplete = function(name, write) {
    //performs all writing
    var path = (cssAPI.config.dir ? cssAPI.config.dir + name + '.css' : cssAPI.config.out.replace(/\.js$/, '.css'));
    
    var css = '';
    for (var n in cssAPI.buffer)
      css += cssAPI.buffer[n];
    
    var output = compress(normalize(css, baseUrl, path));
    
    if (output != '') {
      if (typeof console != 'undefined' && console.log)
        console.log('Writing CSS! file: ' + name + '\n');
      
      saveFile(path, output);
      
      //check if we need to auto load the new built css file as a dependency, or if
      //it will be included manually with a <link> tag.
      var deps = [];
      if (cssAPI.config.loadCSS !== false) {
        var outputName = normalize.convertURIBase(path.substr(1), '/', baseUrl);
        outputName = outputName.substr(0, outputName.length - 4);
        deps.push(cssAPI.pluginName + '!' + outputName);
      }
      
      //write out all the stubs, including a dependency on the build css file if specified
      for (var i = 0; i < cssAPI.stubs.length; i++)
        write('define(\'' + cssAPI.stubs[i] + '\', ' + JSON.stringify(deps) + ', function(){});');
      
      cssAPI.clear();
      cssAPI.stubs = [];
    }
  }
  
  cssAPI.inject = function(name, css) {
    cssAPI.buffer[name] = css;
  }
  cssAPI.clear = function() {
    cssAPI.buffer = {};
  }
  
  return cssAPI;
});
