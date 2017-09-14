import * as utils from "base/utils";
import Model from "base/model";
import Reader from "base/reader";
import EventSource from "base/events";
import { DataStorage } from "base/datastorage";
/*
 * VIZABI Data Model (model.data)
 */

const DataModel = Model.extend({

  /**
   * Default values for this model
   */
  getClassDefaults() {
    const defaults = {
      reader: "csv"
    };
    return utils.deepExtend(this._super(), defaults);
  },

  trackInstances: true,

  /**
   * Initializes the data model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init(name, values, parent, bind) {

    this._type = "data";

    this.queryQueue = {};
    this._collection = {};
    this._collectionPromises = {}; // stores promises, making sure we don't do one calulation twice

    //same constructor as parent, with same arguments
    this._super(name, values, parent, bind);

    this.readerObject = this.getReader();

  },

  /**
   * Loads concept properties when all other models are also starting to load data
   * @return {Promise} Promise which resolves when concepts are loaded
   */
  preloadData() {
    return this.loadConceptProps();
  },

  /**
   * Loads resource from reader or cache
   * @param {Array} query Array with queries to be loaded
   * @param {Object} parsers An object with concepts as key and parsers as value
   * @param {*} evts ?
   */
  load(query, parsers = {}) {
    // add waffle server specific query clauses if set
    if (this.dataset) query.dataset = this.dataset;
    if (this.version) query.version = this.version;
    const dataId = DataStorage.getDataId(query, this.readerObject);
    if (dataId) {
      return Promise.resolve(dataId);
    }
    utils.timeStamp("Vizabi Data: Loading Data");
    EventSource.freezeAll([
      "hook_change",
      "resize"
    ]);

    return DataStorage.loadFromReader(query, parsers, this.readerObject)
      .then(dataId => {
        EventSource.unfreezeAll();
        return dataId;
      })
      .catch(error => this.handleLoadError(error, query));
  },

  getAsset(assetName, callback) {
    return this.readerObject.getAsset(assetName)
      .then(response => callback(response))
      .catch(error => this.handleLoadError(error, assetName));
  },

  getReader() {
    // Create a new reader for this query
    const readerClass = Reader.get(this.reader);
    if (!readerClass) {
      throw new Error("Unknown reader: " + this.reader);
    }

    return new readerClass(this.getPlainObject());
  },

  /**
   * get data
   */
  getData(dataId, what, whatId, args) {
    // if not specified data from what query, return nothing
    if (!dataId) return utils.warn("Data.js 'get' method doesn't like the dataId you gave it: " + dataId);
    return DataStorage.getData(dataId, what, whatId, args);
  },

  loadConceptProps() {
    const query = {
      select: {
        key: ["concept"],
        value: [
          "concept_type",
          "domain",
          "indicator_url",
          "color",
          "scales",
          "interpolation",
          "tags",
          "name",
          "unit",
          "description",
          "format"
        ]
      },
      from: "concepts",
      where: {},
      language: this.getClosestModel("locale").id,
    };

    return this.load(query)
      .then(this.handleConceptPropsResponse.bind(this))
      .catch(error => this.handleLoadError(error, query));

  },

  handleConceptPropsResponse(dataId) {

    this.conceptDictionary = { _default: { concept_type: "string", use: "constant", scales: ["ordinal"], tags: "_root" } };
    this.conceptArray = [];

    this.getData(dataId).forEach(d => {
      const concept = {};

      if (d.concept_type) concept["use"] = (d.concept_type == "measure" || d.concept_type == "time") ? "indicator" : "property";

      concept["concept_type"] = d.concept_type;
      concept["sourceLink"] = d.indicator_url;
      try {
        concept["color"] = d.color && d.color !== "" ? JSON.parse(d.color) : null;
      } catch (e) {
        concept["color"] = null;
      }
      try {
        concept["scales"] = d.scales ? JSON.parse(d.scales) : null;
      } catch (e) {
        concept["scales"] = null;
      }
      if (!concept.scales) {
        switch (d.concept_type) {
          case "measure": concept.scales = ["linear", "log"]; break;
          case "string": concept.scales = ["nominal"]; break;
          case "entity_domain": concept.scales = ["ordinal"]; break;
          case "entity_set": concept.scales = ["ordinal"]; break;
          case "time": concept.scales = ["time"]; break;
        }
      }
      if (concept["scales"] == null) concept["scales"] = ["linear", "log"];
      if (d.interpolation) {
        concept["interpolation"] = d.interpolation;
      } else if (d.concept_type == "measure") {
        concept["interpolation"] = concept.scales && concept.scales[0] == "log" ? "exp" : "linear";
      } else if (d.concept_type == "time") {
        concept["interpolation"] = "linear";
      } else {
        concept["interpolation"] = "stepMiddle";
      }
      concept["concept"] = d.concept;
      concept["domain"] = d.domain;
      concept["tags"] = d.tags;
      concept["format"] = d.format;
      concept["name"] = d.name || d.concept || "";
      concept["unit"] = d.unit || "";
      concept["description"] = d.description;
      this.conceptDictionary[d.concept] = concept;
      this.conceptArray.push(concept);
    });

  },

  getConceptprops(which) {
    return which ?
      utils.getProp(this, ["conceptDictionary", which]) || utils.warn("The concept " + which + " is not found in the dictionary") :
      this.conceptDictionary;
  },

  getConceptByIndex(index, type) {
    //if(!concept && type == "measure") concept = this.conceptArray.filter(f => f.concept_type==="time")[0];
    return this.conceptArray.filter(f => !type || !f.concept_type || f.concept_type === type)[index];
  },

  getDatasetName() {
    if (this.readerObject.getDatasetInfo) {
      const meta = this.readerObject.getDatasetInfo();
      return meta.name + (meta.version ? " " + meta.version : "");
    }
    return this._name;
  },

  setGrouping(dataId, grouping) {
    DataStorage.setGrouping(dataId, grouping);
  },

  getFrames(dataId, framesArray, keys) {
    return DataStorage.getFrames(dataId, framesArray, keys, this.getConceptprops());
  },


  getFrame(dataId, framesArray, neededFrame, keys) {
    //can only be called after getFrames()
    return DataStorage.getFrame(dataId, framesArray, neededFrame, keys);
  },

  listenFrame(dataId, framesArray, keys,  cb) {
    DataStorage.listenFrame(dataId, framesArray, keys,  cb);
  },

  handleLoadError(error, query) {
    if (utils.isObject(error)) {
      const locale = this.getClosestModel("locale");
      const translation = locale.getTFunction()(error.code, error.payload) || "";
      error = `${translation} ${error.message || ""}`.trim();
    }

    utils.warn("Problem with query: ", query);
    this._super(error);
  },

});

export default DataModel;
