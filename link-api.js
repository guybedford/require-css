define({
    links: {},
    load: function(fileUrl, complete) {
      //dont load if already loaded or loading
      if (linkAPI.links[fileUrl]) {
        if (linkAPI.links[fileUrl].loaded)
          complete();
        else {
          var onload = linkAPI.links[fileUrl].onload;
          linkAPI.links[fileUrl].onload = function() {
            complete();
            onload();
          }
        }
        return;
      }
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = fileUrl;
      link.onload = function() {
        link.loaded = true;
        complete();
      };
      document.getElementsByTagName('head')[0].appendChild(link);
      linkAPI.links[fileUrl] = link;
    },
    inject: styleAPI.inject,
    clear: function(name) {
      if (name) {
        if (linkAPI.links[name])
          document.getElementsByTagName('head')[0].removeChild(linkAPI.links[name]);
      }
      else
        for (var l in linkAPI.links)
          document.getElementsByTagName('head')[0].removeChild(linkAPI.links[l]);
    }
  });