/* nb css form below implies inline style in js file for automatic injection */
require(['css!style/style', 'components/component'], function(component) {
  return 'uses the component!';
});
