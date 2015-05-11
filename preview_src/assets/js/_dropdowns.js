/*dropdown*/
function DropDown(el) {
    this.dd = el;
    this.placeholder = el.querySelectorAll('span')[0];
    this.opts = el.querySelectorAll('ul.dropdown > li');
    this.val = '';
    this.index = -1;
    this.initEvents();
}

DropDown.prototype = {
    initEvents: function() {
        var _this = this;

        _this.dd.onclick = function() {
            toggle(this, 'active');
            var ref = this;
            forEachElement('.wrapper-dropdown', function(another) {
	            if(ref !== another) removeClass(another, 'active');
	        });
        };

        for (var i = 0; i < _this.opts.length; i++) {
        	_this.opts[i].addEventListener("click", function() {
        		_this.val = this.innerHTML;
            	_this.placeholder.innerHTML = _this.val;
        	})
        };
    },
    getValue: function() {
        return this.val;
    }
};


forEachElement('.wrapper-dropdown', function(dd) {
    new DropDown(dd);
});