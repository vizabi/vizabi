import Dialog from 'components/dialogs/_dialog';
import DynamicBackground from 'helpers/d3.dynamicBackground';

/*
 * Timedisplay dialog
 */
const TimeDisplay = Dialog.extend({

  init(config, parent) {
    this.name = 'timedisplay';

    this.model_binds = {
      'change:state.time.value': () => {
        this.updateTime();
      }
    };

    this._super(config, parent);
  },

  ready() {
    this.updateTime();
  },
  
  readyOnce() {
    this.element = d3.select(this.element);
    this.timeLabel = new DynamicBackground(this.element.select('.vzb-timedisplay'));
    this.timeLabel.setConditions({ yAlign: 'top', topOffset: 25 });
    this.timeLabel.resize(this.element.style('width'), this.element.style('height'), 100);
  },

  updateTime() {
    var timeMdl = this.model.state.time;
    this.time_1 = this.time == null ? timeMdl.value : this.time;
    this.time = timeMdl.value;
    var duration = timeMdl.playing && (this.time - this.time_1 > 0) ? timeMdl.delayAnimations : 0;
    this.timeLabel.setText(timeMdl.timeFormat(this.time), duration);
  }

});

export default TimeDisplay;
