import Dialog from "components/dialogs/_dialog";
import DynamicBackground from "helpers/d3.dynamicBackground";

/*
 * Timedisplay dialog
 */
const TimeDisplay = Dialog.extend({

  init(config, parent) {
    this.name = "timedisplay";

    this.model_binds = {
      "change:state.time.value": () => {
        this.updateTime();
      }
    };

    this._super(config, parent);
  },

  ready() {
    this.updateTime();
  },

  readyOnce() {
    this._super();
    this.timeLabel = new DynamicBackground(this.element.select(".vzb-timedisplay"));
    this.timeLabel.setConditions({ widthRatio: 1, heightRatio: 1 });
    this.timeLabel.resize(this.contentEl.style("width"), this.contentEl.style("height"));
  },

  updateTime() {
    const timeMdl = this.model.state.time;
    this.time_1 = this.time == null ? timeMdl.value : this.time;
    this.time = timeMdl.value;
    const duration = timeMdl.playing && (this.time - this.time_1 > 0) ? timeMdl.delayAnimations : 0;
    this.timeLabel.setText(timeMdl.formatDate(this.time, "ui"), duration);
  }

});

export default TimeDisplay;
