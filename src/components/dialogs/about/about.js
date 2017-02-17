import * as utils from "base/utils";
import Dialog from "components/dialogs/_dialog";
import globals from "base/globals";

/*
 * Size dialog
 */

const About = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
  init(config, parent) {
    this.name = "about";

    this._super(config, parent);
  },

  readyOnce() {
    const version = globals.version;
    const updated = new Date(parseInt(globals.build));

    this.element = d3.select(this.element);
    this.element.select(".vzb-about-text0")
      .html("This chart is made with Vizabi,");
    this.element.select(".vzb-about-text1")
      .html("a project by <a href='http://gapminder.org'>Gapminder Foundation</a>");
    this.element.select(".vzb-about-version")
      .html("<a href='https://github.com/Gapminder/vizabi/releases/tag/v" + version + "'>Version: " + version + " (alpha)</a>");
    this.element.select(".vzb-about-updated")
      .html("Build: " + d3.time.format("%Y-%m-%d at %H:%M")(updated));
    this.element.select(".vzb-about-text2")
      .html("Alpha version: don't expect too much!");
    this.element.select(".vzb-about-report")
      .html("<a href='https://getsatisfaction.com/gapminder/'>Report a problem</a>");
    this.element.select(".vzb-about-credits")
      .html("<a href='https://github.com/Gapminder/vizabi/graphs/contributors'>Contributors</a>");
  }


});

export default About;
