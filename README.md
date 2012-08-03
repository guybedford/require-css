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

4. When included with the alternative require syntax: `'css!styles/main!'`, then instead of being inlined, the CSS layer is output to a separate CSS file.

_All url path normalization within the CSS files is handled automatically_


Installation and Setup
----------------------

The easiest setup is with volo (`npm install volo` / https://github.com/volojs/volo):

```
volo add guybedford/require-css
```

Volo will automatically install the following plugins:
* requirejs/text
  The standard text plugin provided by Require JS - used for loading CSS resources on the client.

To allow the usage with 'css!', set the path to require-css in the map config:

```javascript
map: {
  '*': {
    css: 'require-css/css'
  }
}
```

If installing without Volo, ensure you have the text plugin dependency in the scripts folder (the same folder the require-css folder is in).


Optimizer Configuration
-----------------------

### Basic Usage

Optimizer configuration:

```javascript
{
  modules: [
  {
    name: 'mymodule',
    include: ['css!>>mymodule']
  }
  ]
}
```

*Note: the use of the include, `'css!>>mymodule'`, is necessary pending r.js pull request #210 (https://github.com/jrburke/r.js/pull/210).*

If the contents of 'mymodule' are:

```javascript
  require(['css!inline', 'css!page!'], function(css) {
    //...
  });
```

Then the optimizer output would be:

-mymodule.js containing:
 inline.css which will be dynamically injected

-mymodule.css containing:
 page.css

Had there been further CSS inclusions with the suffix '!' as part of the dependency tree, these would have also been included in mymodule.css.


Conditional CSS
---

Some styles are conditional on the environment. For example mobile stylesheets and IE-specific stylesheets.

To manage this, use the [Require-IS](https://github.com/guybedford/require-is) module. 

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

Separate build layers can then be made for mobile specific use. Read more at the [Require-IS](https://github.com/guybedford/require-is) project page.


Roadmap
-------

* Comprehensive CSS minification including style reduction
* LESS extension
* Sprite compilation
