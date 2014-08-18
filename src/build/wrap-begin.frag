//Wrap library in UMD module

(function(root, factory) {
    if (typeof define === 'function') {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Vizabi = factory();
    }
}(this, function() {