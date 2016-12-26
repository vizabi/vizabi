import Dialog from 'components/dialogs/_dialog';

/*
 * Year dialog
 */
const Year = Dialog.extend({

  init(config, parent) {
    this.name = 'year';

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
    this.contentEl.text(time.timeFormat(time.value));
  }

});

export default Year;
