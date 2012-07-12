define(['text', './css.js', 'require'], function(text, css, req) {
  
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
  
  css.linkBuffer = {};
  
  css.normalize = function(name, normalize) {
    var parts = name.split(']');
    parts[0] = normalize(parts[0]);
    return parts.join(']');
  }
  
  css.escape = function(content) {
    return content.replace(/(['\\])/g, '\\$1')
        .replace(/[\f]/g, "\\f")
        .replace(/[\b]/g, "\\b")
        .replace(/[\n]/g, "\\n")
        .replace(/[\t]/g, "\\t")
        .replace(/[\r]/g, "\\r");
  }
  
  css.load = function(name, req, load, config) {
    //just return
    load(this);
  }
  
  css.write = function(pluginName, moduleName, write) {
    
    //all css defines made as empty, unless a write or buffer point
    //but we do inclusion on write not load for the optimizer (to allow exclusions!)
    if (moduleName.substr(0, 1) != '>') {
      
      var linkSuffix = moduleName.match(/\[([^\]]*)\]/);
      var fileName = moduleName;
      if (linkSuffix) {
        linkSuffix = linkSuffix[1];
        if (linkSuffix != '')
          fileName = moduleName.replace(/\[([^\]]*)\]/, '-$1');
        else
          fileName = moduleName.replace(/\[([^\]]*)\]/, '');
      }
        
      var loaded_css = loadFile(req.toUrl(fileName + '.css'));
      
      //check if we have a link suffix for building into a file instead of script
      if (linkSuffix !== null) {
        this.linkBuffer[linkSuffix] = this.linkBuffer[linkSuffix] || '';
        this.linkBuffer[linkSuffix] += this.convertStyleBase(loaded_css, require.toUrl(fileName), require.toUrl('.'));
      }
      //otherwise load into our standard buffer
      else
        this.buffer += this.convertStyleBase(loaded_css, require.toUrl(fileName), require.toUrl('.'));
      
      write.asModule(pluginName + '!' + moduleName, 'define(function(){})');
      return;
    }
    

    /*
      modules = [
      {
        main: 'my.css',
        include: ['css!some[ie]', 'css!>>my']
      },
      {
        name: 'another',
        include: ['css!thing', 'css!two', 'css!>>']
      }
      ];
    
      buffer points specified by 'css!>>', outputs the current buffer into the script (asynchronous)
      write and buffer points specified by 'css!>>my/file' to perform both at once
    
      write points specified by 'css!>my/file', output the linkBuffer with prefixes (blocking)
      so we get outputs: my/file.css, my/file.ie.css, my/file.print.css etc
    */
    
    //buffer point
    if (moduleName.substr(0, 2) == '>>') {
      var output = compress(css.escape(css.buffer));
      if (output != '')
        write('require([\'css\'], function(css) {\n  css.add("' + output + '");\n})');
      css.buffer = '';
    }
    
    //write point
    var fileName = moduleName.replace(/^>{1,2}/, '');
    if (fileName != '') {
      console.log(moduleName);
      console.log(fileName);
      for (var suffix in this.linkBuffer) {
        var output = compress(css.convertStyleBase(this.linkBuffer[suffix], require.toUrl('.'), require.toUrl(fileName)));
        if (output != '')
          saveFile(require.toUrl(fileName + (suffix ? '-' + suffix : '') + '.css'), output);
        this.linkBuffer[suffix] = '';
      }
    }
  }
  
  return css;
});
