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
        this.draw();
      }
    };

    this._super(config, parent);
  },

  ready() {
    this.draw();
  },

  draw() {
    const { time } = this.model.state;
    const background = new DynamicBackground(this.contentEl.select('.vzb-timedisplay'));

    background.setConditions({ xAlign: 'left', yAlign: 'top', topOffset: 5 });
    background.setText(time.timeFormat(time.value), 1);
    background.resize(this.contentEl.style('width'), this.contentEl.style('height'), 110);
  }

});

export default TimeDisplay;
