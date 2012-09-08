define({
  
  onBufferWrite: function() {},
  
  buffer: '',
  scriptBuffer: '',
    
  add: function(css, basePath, scriptOnly) {
    //if (typeof css != 'string')
    //  return;

    //CSS paths are normalized based on an optional basePath and the requirejs config
    //If a basePath is provided, this is assumed to specify the location of the css root
    //relative to the baseUrl in requirejs.
    //If a basePath is not provided, the paths are all expected to be relative to the
    //baseUrl anyway
    //The conversion into 'buffer space' normalizes all urls to the requirejs baseUrl
    //The injection on the client normalizes from baseUrl to the page baseURI
    //to flatten all css dependencies.
    //Absolute dependencies are left untouched.
    
    if (basePath)
      css = this.convertStyleBase(css, require.toUrl(basePath), require.toUrl('.'));
    
    if (!scriptOnly) {
      if (this.buffer.indexOf(css) == -1)
        this.buffer += css;
    }
    else {
      this.scriptBuffer += css;
    }

    this.onBufferWrite();
  },
  
  clear: function() {
    this.buffer = '';
    this.scriptBuffer = '';
    this.onBufferWrite();
  },
    
  /* convert a relative uri to a different base url
   * ../images/img.jpg, /my/site/css/css.css, /my/site/ -> images/img.jpg
   * applies to url(...), url(''), url("") and import(...) statements
   */
  convertStyleBase: function(source, fromBase, toBase) {
    
    urlRegEx = /(url\(\s*"(.*)"\s*\))|(url\(\s*'(.*)'\s*\))|(url\(\s*(.*)\s*\))/g;
    
    while (result = urlRegEx.exec(source)) {
      url = this.convertURIBase(result[2] || result[4] || result[6], fromBase, toBase);
      source = source.replace(result[2] || result[4] || result[6], url);
    }
    
    importRegEx = /(@import\s*'(.*)')|(@import\s*"(.*)")/g;
    
    while (result = importRegEx.exec(source)) {
      url = this.convertURIBase(result[2] || result[4], fromBase, toBase);
      source = source.replace(result[2] || result[4], url);
    }
    
    return source;
  },
  
  convertURIBase: function(uri, fromBase, toBase) {
    // absolute urls are left in tact
    if (uri.match(/^\/|([^\:\/]*:)/))
      return uri;
    
    return this.relativeURI(this.absoluteURI(uri, fromBase), toBase);
  },
  
  // given a relative URI, calculate the absolute URI
  absoluteURI: function(uri, base) {
    
    baseParts = base.split('/');
    uriParts = uri.split('/');
    
    baseParts.pop();
    
    while (curPart = uriParts.shift())
      if (curPart == '..')
        baseParts.pop();
      else
        baseParts.push(curPart);
    
    return baseParts.join('/');
  },


  // given an absolute URI, calculate the relative URI
  relativeURI: function(uri, base) {
    
    // reduce base and uri strings to just their difference string
    baseParts = base.split('/');
    baseParts.pop();
    base = baseParts.join('/') + '/';
    i = 0;
    while (base.substr(i, 1) == uri.substr(i, 1))
      i++;
    while (base.substr(i, 1) != '/')
      i--;
    base = base.substr(i + 1);
    uri = uri.substr(i + 1);

    // each base folder difference is thus a backtrack
    baseParts = base.split('/');
    uriParts = uri.split('/');
    out = '';
    while (baseParts.shift())
      out += '../';
    
    // finally add uri parts
    while (curPart = uriParts.shift())
      out += curPart + '/';
    
    return out.substr(0, out.length - 1);
  }
});
