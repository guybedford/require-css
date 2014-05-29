define(['require', './normalize', './parse-module-path', './transform-css'],
function(req, normalize, parseModulePath, getTransformedCss) {
  var cssAPI = {};
  
  var isWindows = !!process.platform.match(/^win/);

  function compress(css) {
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      try {
        var csso = require.nodeRequire('csso');
      }
      catch(e) {
        console.log('Compression module not installed. Use "npm install csso -g" to enable.');
        return css;
      }
      var csslen = css.length;
      try {
        css =  csso.justDoIt(css);
      }
      catch(e) {
        console.log('Compression failed due to a CSS syntax error.');
        return css;
      }
      console.log('Compressed CSS output to ' + Math.round(css.length / csslen * 100) + '%.');
      return css;
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
      var file = new java.io.File(path),
        lineSeparator = java.lang.System.getProperty("line.separator"),
        input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), 'utf-8')),
        stringBuffer, line;
      try {
        stringBuffer = new java.lang.StringBuffer();
        line = input.readLine();
        if (line && line.length() && line.charAt(0) === 0xfeff)
          line = line.substring(1);
        stringBuffer.append(line);
        while ((line = input.readLine()) !== null) {
          stringBuffer.append(lineSeparator).append(line);
        }
        return String(stringBuffer.toString());
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
      var content = new java.lang.String(data);
      var output = new java.io.BufferedWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(path), 'utf-8'));
  
      try {
        output.write(content, 0, content.length());
        output.flush();
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

  // NB add @media query support for media imports
  var importRegEx = /@import\s*(url)?\s*(('([^']*)'|"([^"]*)")|\(('([^']*)'|"([^"]*)"|([^\)]*))\))\s*;?/g;
  var absUrlRegEx = /^([^\:\/]+:\/)?\//;


  var siteRoot;

  var baseParts = req.toUrl('base_url').split('/');
  baseParts[baseParts.length - 1] = '';
  var baseUrl = baseParts.join('/');
  
  var curModule = 0;
  var config;

  var layerBuffer = [];
  var cssBuffer = {};

  // Load a file path on disk
  function loadModuleAsync(toUrl, module, callback) {
    var str = loadFile(toUrl(module));
    callback(str);
  }

  cssAPI.load = function(name, req, load, _config) {
    //store config
    config = config || _config;

    if (!siteRoot) {
      siteRoot = path.resolve(config.dir || path.dirname(config.out), config.siteRoot || '.') + '/';
      if (isWindows)
        siteRoot = siteRoot.replace(/\\/g, '/');
    }

    //external URLS don't get added (just like JS requires)
    if (name.match(absUrlRegEx))
      return load();

    function nodeReq(depNames, callback) {
      var depUrls = depNames.map(req.toUrl);
      var deps = depUrls.map(require.nodeRequire);
      callback.apply({}, deps);
    }
    console.log('transforming css for', name);
    getTransformedCss(
      nodeReq,
      loadModuleAsync.bind({}, req.toUrl),
      getTransformedCss.getTransformEaches(config, 'node'),
      name,
      function withTransformedCss(cssStr) {
        var parsed = parseModulePath(name);
        var fileUrl = req.toUrl(parsed.cssId + '.css');
        var normalizedCssStr = normalize(cssStr, isWindows ? fileUrl.replace(/\\/g, '/') : fileUrl, siteRoot);
        cssBuffer[name] = normalizedCssStr;
        load();
      });
  };
  
  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 4, 4) == '.css')
      name = name.substr(0, name.length - 4);
    return normalize(name);
  };
  
  cssAPI.write = function(pluginName, moduleName, write, parse) {
    //external URLS don't get added (just like JS requires)
    if (moduleName.match(absUrlRegEx))
      return;

    layerBuffer.push(cssBuffer[moduleName]);
    
    if (config.buildCSS != false)
    write.asModule(pluginName + '!' + moduleName, 'define(function(){})');
  }
  
  cssAPI.onLayerEnd = function(write, data) {
    if (config.separateCSS && config.IESelectorLimit)
      throw 'RequireCSS: separateCSS option is not compatible with ensuring the IE selector limit';

    if (config.separateCSS) {
      console.log('Writing CSS! file: ' + data.name + '\n');
      var outPath;
      if (config.dir) {
        outPath = path.resolve(config.dir, config.baseUrl, data.name + '.css');
      } else {
        outPath = config.out.replace(/(\.js)?$/, '.css');
      }

      var css = layerBuffer.join('');

      if (fs.existsSync(outPath))
        console.log('RequireCSS: Warning, separateCSS module path "' + outPath + '" already exists and is being replaced by the layer CSS.');

      process.nextTick(function() {
        saveFile(outPath, compress(css));  
      });
      
    }
    else if (config.buildCSS != false) {
      var styles = config.IESelectorLimit ? layerBuffer : [layerBuffer.join('')];
      for (var i = 0; i < styles.length; i++) {
        if (styles[i] == '')
          return;
        console.log('writing something');
        write(
          "(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})\n"
          + "('" + escape(compress(styles[i])) + "');\n"
        );        
      }
    }    
    //clear layer buffer for next layer
    layerBuffer = [];
  }
  
  return cssAPI;
});
