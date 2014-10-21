define([
    'underscore',
    'base/model'
], function(_, Model) {

    var TimeModel = Model.extend({
        init: function(values) {

            //default values for time model
            values = _.extend({
                value: 50,
                start: 0,
                end: 100,
                show_playpause: true,
                playable: true,
                playing: false,
                step: 1
            }, values);

            this._super(values);
        },

        play: function() {
            //play function
        },

        validate: function() {
            //start has to be smaller than end
            if(this.get('end') > this.get('start')) {
                var temp = this.get('start');
                this.set('start', this.get('end'));
                this.set('end', temp);
            }

            //value has to be between start and end
            if(this.get('value') < this.get('start')) {
                this.set('value', this.get('start'));
            }
            else if(this.get('value') > this.get('start')) {
                this.set('value', this.get('start'));
            }
        }

    });

    return TimeModel;
});