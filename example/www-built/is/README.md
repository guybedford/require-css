Require-IS
===

A conditional loading plugin for [Require-JS](http://requirejs.org/) that works with optimizer builds.

Installation
---

Using [volo](https://github.com/volojs/volo):
```
volo add guybedford/require-is
```

Alternaively, download is.js and place it in the baseUrl folder of a Require-JS project.

Usage
---

Where conditional loads are needed, use the plugin syntax:

```
is![condition]?[moduleId]
```

### Example:

```javascript
define(['is!mobile?mobile-code'], function(mobile) {
  
});
```

If the condition, `[mobile]` is true, then the module `mobile-code` is loaded, otherwise `null` is returned.

The above applies equally well to builds with the [RequireJS optimizer](http://requirejs.org/docs/optimization.html).

### Setting Conditions

There are two ways to set conditions.

**1. Using the RequireJS configuration:**

```javascript
requirejs.config({
  config: {
    is: {
      mobile: true
    }
  }
});
```

Any number of conditions can be set to true or false in this way.

**2. Dynamically during runtime:**

```javascript
require(['is'], function(is) {
  is.set('mobile');
});
```

Any further loads will then use the condition.

**Note that conditions are constants. They can only be set once. As soon as a condition has been used in the loading of a module, it cannot be changed again and any attempts to set it will throw an error.**

This is done in order that conditions can always be built into modules with the RequireJS optimizer.

### Checking conditions

Sometimes it may be useful to check the value of a condition as well.

To do this, simply use the plugin with square brackets around the condition name.

Example:

```javascript
require(['is![mobile]', function(mobile) {
  if (mobile) {
    //only true if mobile condition has been set
  }
});
```
