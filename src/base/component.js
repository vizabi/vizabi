import * as utils from "base/utils";
import Events from "base/events";
import Model from "base/model";
import globals from "base/globals";

const class_loading_first = "vzb-loading-first";
const class_loading_data = "vzb-loading-data";
const class_error = "vzb-error";

const templates = {};
const Component = Events.extend({

  /**
   * Initializes the component
   * @param {Object} config Initial config, with name and placeholder
   * @param {Object} parent Reference to tool
   */
  init(config, parent) {
    this._id = this._id || utils.uniqueId("c");
    this._ready = false;
    this._readyOnce = false;
    this.name = this.name || config.name || this._id;
    this.template = this.template || "<div></div>";
    this.placeholder = this.placeholder || config.placeholder;
    this.template_data = this.template_data || {
      name: this.name
    };
    //make sure placeholder is DOM element
    if (this.placeholder && !utils.isElement(this.placeholder)) {
      try {
        this.placeholder = parent.placeholder.querySelector(this.placeholder);
      } catch (e) {
        utils.error("Error finding placeholder '" + this.placeholder + "' for component '" + this.name + "'");
      }
    }
    this.parent = parent || null;
    this.root = this.parent ? this.parent.root : this;

    this.components = this.components || [];
    this._components_config = this.components.map(x => utils.clone(x));

    //define expected models for this component
    this.model_expects = this.model_expects || [];
    this.model_binds   = this.model_binds || {};
    this.createModel(config.model);

    this.ui = this.model.ui || this.ui || config.ui;
    this._super();

    this.registerListeners();
  },

  createModel(configModel) {
    this.model = this._modelMapping(configModel);
  },

  registerListeners() {
    this.on({
      "readyOnce": this.readyOnce,
      "ready": this.ready,
      "domReady": this.domReady,
      "resize": this.resize
    });
  },

  /**
   * Recursively starts preloading in components
   * @return {[type]} [description]
   */
  startPreload() {

    const promises = [];
    promises.push(this.preload());

    utils.forEach(this.components,
      subComponent => promises.push(subComponent.startPreload())
    );

    return Promise.all(promises);
  },

  preload() {
    return Promise.resolve();
  },

  /**
   * Executes after preloading is finished
   */
  afterPreload() {
    if (this.model) {
      this.model.afterPreload();
    }
    utils.forEach(this.components, subcomp => {
      subcomp.afterPreload();
    });
  },

  /**
   * Renders the component (after data is ready)
   */
  render() {
    this.prerender();
    this.postrender();
  },

  prerender() {
    this.loadTemplate();
    this.loadSubComponents();
  },

  postrender() {
    const _this = this;

    //render each subcomponent
    utils.forEach(this.components, subcomp => {
      subcomp.render();
      _this.on("resize", () => {
        subcomp.trigger("resize");
      });
    });

    this.startLoading();
  },

  /**
   * Overloaded by Tool which starts loading of model
   * @return {[type]} [description]
   */
  startLoading() {
    const _this = this;

    // if a componente's model is ready, the component is ready
    this.model.on("ready", () => {
      _this.loadingDone();
    });

    if (!(this.model && this.model.isLoading())) {
      this.loadingDone();
    }


  },

  loadingDone() {
    utils.removeClass(this.placeholder, class_loading_first);
    utils.removeClass(this.placeholder, class_loading_data);
    this.setReady();
  },

  renderError() {
    utils.removeClass(this.placeholder, class_loading_first);
    utils.removeClass(this.placeholder, class_loading_data);
    utils.addClass(this.placeholder, class_error);
    this.setError({
      type: "data"
    });
  },

  setError(opts) {
    if (typeof this.error === "function") {
      this.error(opts);
    }
  },

  setReady(value) {
    if (!this._readyOnce) {
      this.trigger("readyOnce");
      this._readyOnce = true;
    }
    this._ready = true;
    this.trigger("ready");
  },

  /**
   * Loads the template
   * @returns defer a promise to be resolved when template is loaded
   */
  loadTemplate() {
    const tmpl = this.template;
    let data = this.template_data;
    const _this = this;
    let rendered = "";
    if (!this.placeholder) {
      return;
    }
    //todo: improve t function getter + generalize this
    data = utils.extend(data, {
      t: this.getTranslationFunction(true)
    });
    if (this.template) {
      try {
        rendered = templateFunc(tmpl, data);
      } catch (e) {
        utils.error("Templating error for component: '" + this.name +
          "' - Check if template name is unique and correct. E.g.: 'bubblechart'");

        utils.removeClass(this.placeholder, class_loading_data);
        utils.addClass(this.placeholder, class_error);
        this.setError({
          type: "template"
        });
      }
    }
    //add loading class and html
    utils.addClass(this.placeholder, class_loading_data);
    utils.addClass(this.placeholder, class_loading_first);
    this.placeholder.innerHTML = rendered;
    this.element = this.placeholder.children[0];

    //template is ready
    this.trigger("domReady");
  },

  getActiveProfile(profiles, presentationProfileChanges) {
    // get layout values
    const layoutProfile = this.getLayoutProfile();
    const presentationMode = this.getPresentationMode();
    const activeProfile = utils.deepClone(profiles[layoutProfile]); // clone so it can be extended without changing the original profile

    // extend the profile with presentation mode values
    if (presentationMode && (presentationProfileChanges || {})[layoutProfile]) {
      utils.deepExtend(activeProfile, presentationProfileChanges[layoutProfile]);
    }

    return activeProfile;
  },

  /*
   * Loads all subcomponents
   */
  loadSubComponents() {
    const _this = this;
    let config;
    let comp;
    //use the same name for collection
    this.components = [];

    // Loops through components, loading them.
    utils.forEach(this._components_config, component_config => {

      component_config.model = component_config.model || {};

      if (!component_config.component) {
        utils.error("Error loading component: name not provided");
        return;
      }

      comp = (utils.isString(component_config.component)) ? Component.get(component_config.component) : component_config.component;

      if (!comp) return;

      config = utils.extend(component_config, {
        name: component_config.component,
        ui: _this._uiMapping(component_config.placeholder, component_config.ui)
      });
      //instantiate new subcomponent
      const subcomp = new comp(config, _this);
      _this.components.push(subcomp);
    });
  },

  /**
   * Returns subcomponent by name
   * @returns {Boolean}
   */
  findChildByName(name) {
    return utils.find(this.components, f => f.name === name);
  },

  /**
   * Get layout profile of the current resolution
   * @returns {String} profile
   */
  getLayoutProfile() {
    // get profile from parent if layout is not available
    return this.model.ui ?
      this.model.ui.currentProfile() :
      this.parent.getLayoutProfile();
  },

  /**
   * Get if presentation mode is set of the current tool
   * @returns {Bool} presentation mode
   */
  getPresentationMode() {
    // get profile from parent if layout is not available
    return this.model.ui ?
      this.model.ui.getPresentationMode() :
      this.parent.getPresentationMode();
  },

  //TODO: make ui mapping more powerful
  /**
   * Maps the current ui to the subcomponents
   * @param {String} id subcomponent id (placeholder)
   * @param {Object} ui Optional ui parameters to overwrite existing
   * @returns {Object} the UI object
   */
  _uiMapping(id, ui) {
    //if overwritting UI
    if (ui) {
      return new Model("ui", ui);
    }
    if (id && this.ui) {
      id = id.replace(".", "");
      //remove trailing period
      const sub_ui = this.ui[id];
      if (sub_ui) {
        return sub_ui;
      }
    }
    return this.ui;
  },

  /**
   * Maps the current model to the subcomponents
   * @param {String|Array} model_config Configuration of model
   * @returns {Object} the model
   */
  _modelMapping(model_config) {
    const _this = this;
    const values = {};
    //If model_config is an array, we map it
    if (utils.isArray(model_config) && utils.isArray(this.model_expects)) {

      //if there's a different number of models received and expected
      if (this.model_expects.length !== model_config.length) {
        utils.groupCollapsed("DIFFERENCE IN NUMBER OF MODELS EXPECTED AND RECEIVED");
        utils.warn("Please, configure the 'model_expects' attribute accordingly in '" + this.name + "' or check the models passed in '" + _this.parent.name + "'.\n\n" +
          "Component: '" + _this.parent.name + "'\n" +
          "Subcomponent: '" + this.name + "'\n" +
          "Number of Models Expected: " + this.model_expects.length + "\nNumber of Models Received: " + model_config.length);
        utils.groupEnd();
      }
      utils.forEach(model_config, (m, i) => {
        const model_info = _mapOne(m);
        let new_name;
        if (_this.model_expects[i]) {
          new_name = _this.model_expects[i].name;
          if (_this.model_expects[i].type && model_info.type !== _this.model_expects[i].type &&
            (!utils.isArray(_this.model_expects[i].type) || _this.model_expects[i].type.indexOf(model_info.type) === -1)) {

            utils.groupCollapsed("UNEXPECTED MODEL TYPE: '" + model_info.type + "' instead of '" + _this.model_expects[i].type + "'");
            utils.warn("Please, configure the 'model_expects' attribute accordingly in '" + _this.name + "' or check the models passed in '" + _this.parent.name + "'.\n\n" +
              "Component: '" + _this.parent.name + "'\n" +
              "Subcomponent: '" + _this.name + "'\n" +
              "Expected Model: '" + _this.model_expects[i].type + "'\n" +
              "Received Model: '" + model_info.type + "'\n" +
              "Model order: " + i);
            utils.groupEnd();
          }
        } else {

          utils.groupCollapsed("UNEXPECTED MODEL: '" + model_config[i] + "'");
          utils.warn("Please, configure the 'model_expects' attribute accordingly in '" + _this.name + "' or check the models passed in '" + _this.parent.name + "'.\n\n" +
            "Component: '" + _this.parent.name + "'\n" +
            "Subcomponent: '" + _this.name + "'\n" +
            "Number of Models Expected: " + _this.model_expects.length + "\n" +
            "Number of Models Received: " + model_config.length);
          utils.groupEnd();
          new_name = model_info.name;
        }
        values[new_name] = model_info.model;
      });

      // fill the models that weren't passed with empty objects
      // e.g. if expected = [ui, locale, color] and passed/existing = [ui, locale]
      // it will fill values up to [ui, locale, {}]
      const existing = model_config.length;
      const expected = this.model_expects.length;
      if (expected > existing) {
        //skip existing
        this.model_expects.splice(0, existing);
        //adds new expected models if needed
        utils.forEach(expected, m => {
          values[m.name] = {};
        });
      }
    } else {
      return;
    }
    //return a new model with the defined submodels
    return new Model(this.name, values, null, this.model_binds);
    /**
     * Maps one model name to current submodel and returns info
     * @param {String} name Full model path. E.g.: "state.marker.color"
     * @returns {Object} the model info, with name and the actual model
     */
    function _mapOne(name) {
      const parts = name.split(".");
      let current = _this.parent.model;
      let current_name = "";
      while (parts.length) {
        current_name = parts.shift();
        current = current[current_name];
      }
      return {
        name,
        model: current,
        type: current ? current.getType() : null
      };
    }
  },

  /**
   * Get translation function for templates
   * @param {Boolean} wrap wrap in spam tags
   * @returns {Function}
   */
  getTranslationFunction(wrap) {
    let t_func;
    try {
      t_func = this.model.get("locale").getTFunction();
    } catch (err) {
      if (this.parent && this.parent !== this) {
        t_func = this.parent.getTranslationFunction();
      }
    }
    if (!t_func) {
      t_func = function(s) {
        return s;
      };
    }

    return wrap ?
      this._translatedStringFunction(t_func) :
      t_func;
  },

  /**
   * Get function for translated string
   * @param {Function} translation_function The translation function
   * @returns {Function}
   */
  _translatedStringFunction(translation_function) {
    return function(string) {
      const translated = translation_function(string);
      return '<span data-vzb-translate="' + string + '">' + translated + "</span>";
    };
  },

  /**
   * Translate all strings in the template
   */
  translateStrings() {
    const t = this.getTranslationFunction();
    const strings = this.placeholder.querySelectorAll("[data-vzb-translate]");
    if (strings.length === 0) {
      return;
    }
    utils.forEach(strings, str => {
      if (!str || !str.getAttribute) {
        return;
      }
      str.innerHTML = t(str.getAttribute("data-vzb-translate"));
    });
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available
   * as DOM elements
   */
  readyOnce() {},

  /**
   * Executes after the template and model (if any) are ready
   */
  ready() {},

  /**
   * Executes when the resize event is triggered.
   * Ideally, it only contains operations related to size
   */
  resize() {},

  /**
   * Executed after template is loaded
   * Ideally, it contains instantiations related to template
   */
  domReady() {},

  /**
   * Clears a component
   */
  clear() {
    this.freeze();
    if (this.model) this.model.freeze();
    utils.forEach(this.components, c => {
      c.clear();
    });
  }
});


// Based on Simple JavaScript Templating by John Resig
//generic templating function
function templateFunc(str, data) {

  const func = function(obj) {
    return str.replace(/<%=([^%]*)%>/g, match => {
      //match t("...")
      let s = match.match(/t\s*\(([^)]+)\)/g);
      //replace with translation
      if (s.length) {
        s = obj.t(s[0].match(/"([^"]+)"/g)[0].split('"').join(""));
      }
      //use object[name]
      else {
        s = match.match(/([a-z\-A-Z]+([a-z\-A-Z0-9]?[a-zA-Z0-9]?)?)/g)[0];
        s = obj[s] || s;
      }
      return s;
    });
  };
  // Figure out if we're getting a template, or if we need to
  // load the template - and be sure to cache the result.
  const fn = !/<[a-z][\s\S]*>/i.test(str) ? templates[str] = templates[str] || templateFunc(globals.templates[str]) : func;

  // Provide some basic currying to the user
  return data ? fn(data) : fn;
}

//utility function to check if a component is a component
//TODO: Move to utils?
Component.isComponent = function(c) {
  return c._id && (c._id[0] === "t" || c._id[0] === "c");
};

export default Component;
