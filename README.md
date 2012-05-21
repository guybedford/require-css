require-css
===========

Optimizable CSS requiring with RequireJS

Description
-----------

Experimental formulation of object oriented CSS inclusion using the RequireJS optimizer to amalgamate CSS files.

When run on the client, it downloads the css and injects it into the head dynamically. When used with the RequireJS Optimizer, it amalgamates all the required css together and includes it on the page load.

NOTE: This module is designed primarily to allow for css optimization as part of a requirejs build. It does not determine when the css stylesheet has loaded at all in any form.

Primary Usage
-------------

define(['css!main-stylesheet'], function() {
  //code here
});

Installation and Setup
----------------------

volo add require-css (optional)

Set the path to require-css in your paths config. Optionally also include a parameter which references your css folder for easier paths.

Also ensure you have the text plugin dependency in the scripts folder (the same folder the require-css folder is in).

paths = {
  css: 'require-css/css',
  c: '../css'
}

(or wherever you have placed require-css and your css)

Include css with the plugin syntax (leaving out the extension).

Example:

define(['css!c/my-stylesheet'], function() {
  //code here
});

The "c/" part allows an easy reference to a css folder.
