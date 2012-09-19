/* component */
/* use of extra '!' indicates that css should be output to a file - ie be present on the page load */
/* this is output as a separate css file in the build which must be included manually, along with the layer */
require(['css!components/component'], function() {
  return {component: 'is here'};
});
