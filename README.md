require-css
===========

Optimizable CSS requiring with RequireJS

Overview
--------

Allows the construction of scripts that can inherit CSS, using the simple RequireJS syntax:

```javascript
define(['css!styles/main'], function(css) {
  //code that requires the stylesheet: styles/main.css
});
```

1. When run on the client, the CSS is downloaded and injected into the head dynamically.

2. When run on the server, the CSS is simply ammended into a buffer (`css.buffer`).

3. When run as part of a build with the RequireJS Optimizer, 'css!' dependencies are inlined into the built layer JavaScript for automatic injection. The layers can be built fully compatible with layer exclusions and inclusions.

4. When setting the 'separateCSS' build parameter flag to true, the RequireJS Optimizer creates a separate CSS file matching the module layer in the build.

_All url path normalization within the CSS files is handled automatically_


Installation and Setup
----------------------

The easiest setup is with volo (`npm install volo` / https://github.com/volojs/volo):

```
volo add guybedford/css
```

Volo will automatically install the following plugins:
* requirejs/text
  The standard text plugin provided by Require JS - used for loading CSS resources on the client.

Volo will also create the 'css' wrapper for easy requiring.

If installing without Volo, ensure you have the 'text' plugin dependency in the scripts folder, and add the 'css' shortcut reference in the map config to 'css/main':

```javascript
map: {
  '*': {
    'css': 'css/main'
  }
}
```


Optimizer Configuration
-----------------------

### Basic Usage

Optimizer configuration:

```javascript
{
  modules: [
  {
    name: 'mymodule',
    include: ['css!>>']
  }
  ]
}
```

*Note: the use of the include, `'css!>>'`, is necessary pending r.js pull request #241 (https://github.com/jrburke/r.js/pull/241).*

If the contents of 'mymodule' are:

```javascript
  require(['css!style', 'css!page'], function(css) {
    //...
  });
```

Then the optimizer output would be:

-mymodule.js containing:
 style.css and page.css which will be dynamically injected

### Separate File Output

To output the CSS to a separate file, use the configuration:

```javascript
{
  separateCSS: true,
  modules: [
  {
    name: 'mymodule',
    include: ['css!>>mymodule']
  }
  ]
}
```

This will then output all the css to the file `mymodule.css`.

*To exclude certain CSS from being output as separate files, use the inclusion syntax:*

```javascript
require(['css!mycss!'], ...);
```

*The suffix `!` will ensure that the CSS is never output to a file and always inlined dynamically in the js.*


Conditional CSS
---

Some styles are conditional on the environment. For example mobile stylesheets and IE-specific stylesheets.

To manage this, use the [Require-IS](https://github.com/guybedford/is) module. 

With Require-IS, one can do:

```javascript
require(['is!mobile?css!mobile-css'], function(css) {
  //...
});
```

Mobile detection can be defined through a detection script in Require-IS, such as:

mobile.js:
```javascript
define(function() {
  return navigator.userAgent.match(/iPhone/); //(just iphone detection as an example)
});
```

Separate build layers can then be made for mobile specific use. Read more at the [Require-IS](https://github.com/guybedford/is) project page.


Roadmap
-------

* Comprehensive CSS minification including style reduction
* LESS extension
* Sprite compilation
