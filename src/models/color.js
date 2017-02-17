import * as utils from "base/utils";
import Hook from "models/hook";

/*!
 * VIZABI Color Model (hook)
 */

const defaultPalettes = {
  "_continuous": {
    "_default": "#ffb600",
    "0": "#B4DE79",
    "50": "#E1CE00",
    "100": "#F77481"
  },
  "_discrete": {
    "_default": "#ffb600",
    "0": "#4cd843",
    "1": "#e83739",
    "2": "#ff7f00",
    "3": "#c027d4",
    "4": "#d66425",
    "5": "#0ab8d8",
    "6": "#bcfa83",
    "7": "#ff8684",
    "8": "#ffb04b",
    "9": "#f599f5",
    "10": "#f4f459",
    "11": "#7fb5ed"
  },
  "_default": {
    "_default": "#93daec"
  }
};

const ColorModel = Hook.extend({

  /**
   * Default values for this model
   */
  getClassDefaults() {
    const defaults = {
      use: null,
      which: null,
      scaleType: null,
      syncModels: [],
      palette: {},
      paletteLabels: null,
      allow: {
        //this is almost everything, but not "nominal", so no random strings like "name"
        scales: ["linear", "log", "genericLog", "time", "pow", "ordinal"]
      }
    };
    return utils.deepExtend(this._super(), defaults);
  },

  autoGenerateModel() {
    if (this.which == null) {
      let concept;
      if (this.autogenerate) {
        concept = this.dataSource
          .getConceptByIndex(this.autogenerate.conceptIndex, this.autogenerate.conceptType);

        if (concept) {
          this.which = concept.concept;
          this.use = "indicator";
          this.scaleType = "linear";
        }

      }
      if (!concept) {
        this.which = "_default";
        this.use = "constant";
        this.scaleType = "ordinal";
      }
    }
    if (this.scaleType == null) {
      this.scaleType = this.dataSource
          .getConceptprops(this.which).scales[0];
    }
  },

  /**
   * Initializes the color hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init(name, values, parent, bind) {
    const _this = this;
    this._type = "color";

    this._super(name, values, parent, bind);

    this._syncModelReferences = {};
    this._hasDefaultColor = false;

    this.on("hook_change", () => {
      if (_this._readyOnce) return;

      if (_this.palette && Object.keys(_this.palette._data).length !== 0) {
        const defaultPalette = _this.getDefaultPalette();
        const currentPalette = _this.getPalette(true);
        const palette = {};
        //extend partial current palette with default palette and
        //switch current palette elements which equals
        //default palette elments to nonpersistent state
        Object.keys(defaultPalette).forEach(key => {
          if (!currentPalette[key] || defaultPalette[key] == currentPalette[key]) palette[key] = defaultPalette[key];
        });
        _this.set("palette", palette, false, false);
      }
    });
  },

  setInterModelListeners() {
    this._super();
    this._setSyncModels();
  },

  // args: {colorID, shadeID}
  getColorShade(args) {
    const palette = this.getPalette();

    if (!args) return utils.warn("getColorShade() is missing arguments");

    // if colorID is not given or not found in the palette, replace it with default color
    if (!args.colorID || !palette[args.colorID]) args.colorID = "_default";

    // if the resolved colr value is not an array (has only one shade) -- return it
    if (!utils.isArray(palette[args.colorID])) return palette[args.colorID];

    const conceptpropsColor = this.getConceptprops().color;
    const shade = args.shadeID && conceptpropsColor && conceptpropsColor.shades && conceptpropsColor.shades[args.shadeID] ? conceptpropsColor.shades[args.shadeID] : 0;

    return palette[args.colorID][shade];

  },

  /**
   * Get the above constants
   */
  isUserSelectable() {
    const conceptpropsColor = this.getConceptprops().color;
    return conceptpropsColor == null || conceptpropsColor.selectable == null || conceptpropsColor.selectable;
  },

  setWhich(newValue) {
    this._super(newValue);
    if (this.palette) this.palette._data = {};
    this._setSyncModels();
  },

  _setSyncModels() {
    const _this = this;
    this.syncModels.forEach(modelName => {
      //fetch the model to sync, it's marker and entities
      const model = _this.getClosestModel(modelName);
      const marker = model.isHook() ? model._parent : model;
      const entities = marker.getClosestModel(marker.space[0]);

      //save the references here locally
      _this._syncModelReferences[modelName] = { model, marker, entities };

      if (_this.isDiscrete()) _this._setSyncModel(model, marker, entities);
    });
  },

  _setSyncModel(model, marker, entities) {
    if (model == marker) {
      const newFilter = {
        dim: this.which,
        show: {}
      };
      marker.setDataSourceForAllSubhooks(this.data);
      entities.set(newFilter, false, false);
    } else {
      if (model.isDiscrete() && model.use !== "constant") model.set({ which: this.which, data: this.data }, false, false);
    }
  },

  getColorlegendMarker() {
    return (this._syncModelReferences["marker_colorlegend"] || {})["marker"];
  },

  getColorlegendEntities() {
    return (this._syncModelReferences["marker_colorlegend"] || {})["entities"];
  },

  /**
   * set color
   */
  setColor(value, pointer) {
    const temp = this.getPalette();
    temp[pointer] = value;
    this.scale.range(utils.values(temp));
    this.palette[pointer] = value;
  },


  /**
   * maps the value to this hook's specifications
   * @param value Original value
   * @returns hooked value
   */
  mapValue(value) {
    //if the property value does not exist, supply the _default
    // otherwise the missing value would be added to the domain
    if (this.scale != null && this.isDiscrete() && this._hasDefaultColor && this.scale.domain().indexOf(value) == -1) value = "_default";
    return this._super(value);
  },


  getDefaultPalette() {
    const conceptpropsColor = this.getConceptprops().color;
    let palette;

    this.discreteDefaultPalette = false;

    if (conceptpropsColor && conceptpropsColor.palette) {
        //specific color palette from hook concept properties
      palette = utils.clone(conceptpropsColor.palette);
    } else if (defaultPalettes[this.which]) {
        //color palette for this.which exists in palette defaults
      palette = utils.clone(defaultPalettes[this.which]);
    } else if (this.use === "constant") {
        //an explicit hex color constant #abc or #adcdef is provided
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(this.which)) {
        palette = { "_default": this.which };
      } else {
        palette = utils.clone(defaultPalettes["_default"]);
      }
    } else {
      palette = utils.clone(defaultPalettes[this.isDiscrete() ? "_discrete" : "_continuous"]);
      this.discreteDefaultPalette = true;
    }

    return palette;
  },

  _getPaletteLabels() {
    const conceptpropsColor = this.getConceptprops().color;
    let paletteLabels = null;

    if (conceptpropsColor && conceptpropsColor.paletteLabels) {
        //specific color palette from hook concept properties
      paletteLabels = utils.clone(conceptpropsColor.paletteLabels);
    }
    return paletteLabels;
  },

  getPaletteLabels() {
    return this.paletteLabels.getPlainObject();
  },

  getPalette(includeDefault) {
    //rebuild palette if it's empty
    if (!this.palette || Object.keys(this.palette._data).length === 0) {
      const palette = this.getDefaultPalette();
      this.set("palette", palette, false, false);
      const paletteLabels = this._getPaletteLabels();
      this.set("paletteLabels", paletteLabels, false, false);
    }
    const palette = this.palette.getPlainObject();
    if (this.use === "indicator" && !includeDefault) {
      delete palette["_default"];
    }
    return palette;
  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale(scaleType = this.scaleType) {
    const _this = this;

    const paletteObject = _this.getPalette();
    let domain = Object.keys(paletteObject);
    let range = utils.values(paletteObject);

    this._hasDefaultColor = domain.indexOf("_default") > -1;

    if (scaleType == "time") {

      const timeMdl = this._space.time;
      const limits = timeMdl.splash ?
          { min: timeMdl.parse(timeMdl.startOrigin), max: timeMdl.parse(timeMdl.endOrigin) }
          :
          { min: timeMdl.start, max: timeMdl.end };

      const singlePoint = (limits.max - limits.min == 0);

      domain = domain.sort((a, b) => a - b);
      range = domain.map(m => singlePoint ? paletteObject[domain[0]] : paletteObject[m]);
      domain = domain.map(m => limits.min.valueOf() + m / 100 * (limits.max.valueOf() - limits.min.valueOf()));

      this.scale = d3.time.scale.utc()
        .domain(domain)
        .range(range)
        .interpolate(d3.interpolateRgb);

    } else if (!this.isDiscrete()) {

      let limits = this.getLimits(this.which);
      //default domain is based on limits
      limits = [limits.min, limits.max];
      //domain from concept properties can override it if defined
      limits = this.getConceptprops().domain ? this.getConceptprops().domain : limits;

      const singlePoint = (limits[1] - limits[0] == 0);

      domain = domain.sort((a, b) => a - b);
      range = domain.map(m => singlePoint ? paletteObject[domain[0]] : paletteObject[m]);
      domain = domain.map(m => limits[0] + m / 100 * (limits[1] - limits[0]));

      if (d3.min(domain) <= 0 && d3.max(domain) >= 0 && scaleType === "log") scaleType = "genericLog";

      if (scaleType == "log" || scaleType == "genericLog") {
        const s = d3.scale.genericLog()
          .domain(limits)
          .range(limits);
        domain = domain.map(d => s.invert(d));
      }
      this.scale = d3.scale[scaleType]()
        .domain(domain)
        .range(range)
        .interpolate(d3.interpolateRgb);

    } else {
      range = range.map(m => utils.isArray(m) ? m[0] : m);

      scaleType = "ordinal";

      if (this.discreteDefaultPalette) domain = domain.concat(this.getUnique(this.which));
      this.scale = d3.scale[scaleType]()
        .domain(domain)
        .range(range);
    }

    this.scaleType = scaleType;
  }

});

export default ColorModel;
