define(['./css.api', 'require'], function(cssAPI, req) {
  var css = {};

  //todo: include compression with redundancy
  var compress = function(css) {
    return css;
  }
  
  //load file code - stolen from text plugin
  var loadFile = function(path) {
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
  
  
  var saveFile = function(path, data) {
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
        
        //hmm...
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
  
  //separate buffer for blocking css
  //specified by css!my/css[], css!my/css[ie], css!my/css[custom-suffix] etc
  //part in [] corresponds to a prefix to add to the filename
  //so in build, we create two files
  //build.css, build.ie7.css
  //this allows for media query / ie stylesheet separation
  
  //when adding to the link buffer, paths are normalised to the baseUrl
  //when removing from the link buffer, paths are normalised to the output file path
  
  css.add = function() {
    return cssAPI.add.apply(cssAPI, arguments);
  }
  css.clear = function() {
    return cssAPI.clear.apply(cssAPI, arguments);
  }
  
  css.normalize = function(name, normalize) {
    if (name.substr(name.length - 1, 1) == '!') {
      return normalize(name.substr(0, name.length - 1)) + '!';
    }
    return normalize(name);
  }
  
  css.escape = function(content) {
    return content.replace(/(["'\\])/g, '\\$1')
        .replace(/[\f]/g, "\\f")
        .replace(/[\b]/g, "\\b")
        .replace(/[\n]/g, "\\n")
        .replace(/[\t]/g, "\\t")
        .replace(/[\r]/g, "\\r");
  }
  
  css.load = function(name, req, load, config) {
    //store config
    css.config = css.config || config;
    //just return
    load();
  }
  
  css.write = function(pluginName, moduleName, write) {
    //all css defines made as empty, unless a write or buffer point
    //but we do inclusion on write not load for the optimizer (to allow exclusions!)
    if (moduleName.substr(0, 2) != '>>') {
      
      var scriptOnly = moduleName.substr(moduleName.length - 1, 1) == '!';
      
      if (scriptOnly)
        fileName = moduleName.substr(0, moduleName.length - 1);
      else
        fileName = moduleName;
        
      var loaded_css = loadFile(req.toUrl(fileName + '.css'));
      
      //add to the appropriate buffer
      cssAPI.add(loaded_css, fileName, scriptOnly);
      
      //write as a stub
      write.asModule(pluginName + '!' + moduleName, 'define(function(){})');
      return;
    }
    
    //buffer / write point
    if (moduleName.substr(0, 2) == '>>')
      css.onLayerComplete(moduleName.substr(2), write);
  }
  
  css.onLayerComplete = function(name, write) {
    //inline the inline buffer
    css.writeScriptBuffer(write);
    
    //write the file buffer
    if (css.config.separateCSS && cssAPI.buffer != '') {
      var path = (css.config.dir ? css.config.dir + name + '.css' : css.config.out.replace(/\.js$/, '.css'));
      if (typeof console != 'undefined' && console.log)
        console.log('Writing CSS! file: ' + name + '\n');
      var output = compress(cssAPI.convertStyleBase(cssAPI.buffer, require.toUrl('.'), path));
      if (output != '')
        saveFile(path, output);
    }
    
    cssAPI.clear();
  }
  
  css.writeScriptBuffer = function(write) {
    var outputBuffer = css.config.separateCSS ? cssAPI.scriptBuffer : cssAPI.buffer + cssAPI.scriptBuffer;
    
    var output = compress(css.escape(outputBuffer));
    
    if (output != '')
      write('require([\'css\'], function(css) {\n  css.add("' + output + '");\n})');
  }
  
  return css;
});
