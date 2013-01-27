require-css
===========

RequireJS CSS requiring and optimization.

For LESS inclusion, use [require-less](https://github.com/guybedford/require-less), which behaves and builds the css exactly like this module apart from the preprocessing step.

Overview
--------

Allows the construction of scripts that can require CSS, using the simple RequireJS syntax:

```javascript
define(['css!styles/main'], function() {
  //code that requires the stylesheet: styles/main.css
});
```

### CSS Requiring
* **CSS requiring** CSS is downloaded and injected into the page. Url path normalization of assets within the CSS file is managed.
* **Fully compatible load callback** The plugin call is loaded once the CSS is downloaded and injected. This method works across all browsers and devices. It bypasses the `onload` support issues that make this a tricky problem otherwise (http://requirejs.org/docs/faq-advanced.html#css).
* **Cross-domain CSS** Cross-domain CSS is loaded with the use of a `<link>` tag, but build and onload support are not provided for these - the callback fires instantly.

### CSS Building
* **CSS builds** When run as part of a build with the RequireJS optimizer, `css!` dependencies are automatically inlined into the built layer within the JavaScript, fully compatible with layering. CSS injection is performed as soon as the layer is loaded.
* **Option to build separate layer CSS files** A `separateCSS` build parameter allows for built layers to output their css files separately, instead of inline with the JavaScript, for manual inclusion.
* **CSS compression** CSS redundancy compression is supported through the external library, [csso](https://github.com/css/csso).

Installation and Setup
----------------------

Download the require-css folder manually or use [volo](https://github.com/volojs/volo)(`npm install volo -g`):

```bash
volo add guybedford/require-css
```

To allow the direct `css!` usage, add the following [map configuration](http://requirejs.org/docs/api.html#config-map) in RequireJS:

```javascript
map: {
  '*': {
    'css': 'require-css/css'
  }
}
```

Use Cases and Benefits
----------------------

### Motivation

The use case for RequireCSS came out of a need to manage templates and their CSS together. The idea being that a CSS require can be a dependency of the code that dynamically renders a template. When writing a large dynamic application, with templates being rendered on the client-side, it can be beneficial to inject the CSS as templates are required instead of dumping all the CSS together separately. The added benefit of this is then being able to build the CSS naturally with the RequireJS optimizer, which also supports [separate build layers](http://requirejs.org/docs/1.0/docs/faq-optimization.html#priority) as needed.

### Script-inlined CSS Benefits

By default, during the build CSS is compressed and inlined as a string within the layer that injects the CSS when run.

If the layer is included as a `<script>` tag, only one browser request is needed instead of many separate CSS requests with `<link>` tags.

Even better than including a layer as a `<script>` tag is to include the layer dynamically with a non-blocking require. Then the page can be displayed while the layer is still loading asynchronously in the background. In this case, the CSS that goes with a template being dynamically rendered is loaded with that same script asynchronously. No longer does it need to sit in a `<link>` tag that blocks the page display unnecessarily.


Injection methods
-----------------

Previous attempts have used the `onLoad` callback for a `<link>` tag to register CSS require completion. This method is limited since while it is supported in all versions of IE, it has varying support in other browsers and mobile devices. Because it can't reliably work, there are many hacks which are used to get around this.

In a typical use case, one doesn't mind if the assets have completed downloading yet. Hence the main CSS load requirement is that the CSS has been downloaded and parsed.

CSS parsing speeds are quick enough that a dynamic injection will in most cases be instantanous. Thus, there is no real disadvantage to the method used here.

CSS content is downloaded as text, injected into a `<style>` tag, and the load callback is run immediately after injection. Typically this would be followed by a rendering stage, and this hasn't resulted in any content flashes whatsoever in tests so far across devices.

_Note: It is advisable to avoid `import` tags in CSS files, as the injection callback will not be able to detect when these are loaded._

If CSS resources such as images are important to be loaded first, these can be added to the require through a loader plugin that can act as a preloader such as [image](https://github.com/millermedeiros/requirejs-plugins) or [font](https://github.com/millermedeiros/requirejs-plugins). Then a require can be written of the form:

```javascript
require(['css!my-css', 'image!preload-background-image.jpg', 'font!google,families:[Tangerine]']);
```

If you'd like to force links to be added instead of injecting directly into style tags, put the following option in your requirejs configuration:

```javascript
requirejs.config({
  //...
  css: {
    useLinks: true
  }
});

```


Modular CSS
-----------

RequireCSS implies a CSS modularisation where styles can be scoped directly to the render code that they are bundled with.

Just like JS requires, the order of CSS injection can't be guaranteed. The idea here is that whenever there are style overrides, they should
be based on using a more specific selector with an extra id or class at the base, and not assuming a CSS load order. Reset and global styles are a repeated dependency of all 
modular styles that build on top of them.

Development Environment
-----------------------

When developing on a local file server, an AJAX request will be made to load each CSS file. 
This can conflict with browser origin settings on the local server as AJAX requests are by default
not allowed to other files.

To enable this, configure the browser to allow this, or set CORS headers.

As an example, [some configuration help for Chrome is given here](http://askubuntu.com/questions/160245/making-google-chrome-option-allow-file-access-from-files-permanent).

Optimizer Configuration
-----------------------

### Basic Usage

Optimizer configuration:

```javascript
{
  modules: [
  {
    name: 'mymodule'
  }
  ]
}
```

If the contents of 'mymodule' are:

```javascript
  define(['css!style', 'css!page'], function(css) {
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
    name: 'mymodule'
  }
  ]
}
```

This will then output all the css to the file `mymodule.css`. This configuration can also be placed on the module object itself for layer-specific settings.

Optimization is fully compatible with exclude and include.

**Note: Optimization will only work when using r.js version 2.1.0 or later (released Oct 4 2012)**


CSS Compression
---------------

CSS compression is supported with [csso](https://github.com/css/csso).

To enable the CSS compression, install csso with npm:

```
  npm install csso -g
```

The build log will display the compression results.

When running the r.js optimizer through NodeJS, sometimes the global module isn't found. In this case install csso as a local node module so it can be found.


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
* ~~Comprehensive CSS minification including style reduction~~
* ~~LESS extension~~
* Sprite compilation
* Source maps?

Suggestions always appreciated - feel free to post a feature request.
