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

1. When run on the client, the CSS is downloaded and injected into the head dynamically. The dependency provided by the require is purely the API itself, and not the actual CSS.

2. When run on the server, the CSS is simply ammended into a buffer (`css.buffer`, a string that can be accessed from the returned dependency API).

3. When run as part of a build with the RequireJS Optimizer, all 'css!' dependencies are inlined into the build layer script file, creating a CSS layer to match the build layer. The plugin handles automatic rewriting of all CSS url normalization for the CSS built output. When run, inlined CSS is loaded automatically rewritten based on the
current page baseURI.

4. When included with the alternative require syntax: `'css!styles/main!'`, then instead of being inlined, the CSS layer is output to a separate CSS file.





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
},
paths = {
  c: 'css'
}
```

Note that this will make it impossible to reference a folder called 'css'.
Thus it can help to include a parameter ('c' here) which references your css folder for easier paths.

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
 inline.css ready for dynamic injection

-mymodule.css containing:
 page.css

Had there been further CSS inclusions with the suffix '!' as part of the dependency tree, these would have also been included in mymodule.css.


### Output File Use Cases

We distinguish between CSS inlined into a build layer script and CSS output into a separate file based on the
following use cases:

1. *Blocking CSS:* The primary advantage of a dedicated CSS file is to allow the standard link tag inclusion of CSS to specify CSS that should block the page render.
   (Assuming that one includes the optimized source as part of using 'data-main' or a similar asynchronous approach)
   CSS that that can be loaded only at the point the script loads is still inlined in the JS layer.
   
   This is exactly as illustrated above.

2. *Conditional CSS*: The other use case for separate CSS output is for stylesheets that can be optionally included on the page - eg IE-specific styles, print styles,
and media queries. Basically, any type of conditional CSS can be separately compiled.

Require-css does not handle the conditional loading of these. It is suggested to use a separate plugin for the feature detection eg the Feature plugin.

With the feature plugin one could use:

```javascript
require(['feature!css!my-css'], function(css) {
  //...
});

With the css then being defined to the environment.

Perhaps there is room for separate plugins of the form:

```javascript
require(['ie!css!my-css', 'mobile!css!my-css'], function(css) {
  //...
});
```

Where the separate 'ie' and 'mobile' plugins could be configurable for build environments and runtime detection.

Implementations of the above plugins would be welcomed.



Roadmap
-------

* Comprehensive CSS minification including style reduction
* LESS extension
* Sprite compilation
