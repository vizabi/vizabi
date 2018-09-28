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
      reader: "inline"
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
    return this.loadDataAvailability()
      .then(this.loadConceptProps.bind(this));
  },

  /**
   * Loads resource from reader or cache
   * @param {Array} query Array with queries to be loaded
   * @param {Object} parsers An object with concepts as key and parsers as value
   * @param {*} evts ?
   */
  load(query, parsers = {}, sideLoad) {
    // deep clone to prevent one query sent to multiple data objects being manipulated cross-data model.
    // For example one query sent to two different waffle server datasets.
    query = utils.deepClone(query);
    // add waffle server specific query clauses if set
    if (this.dataset) query.dataset = this.dataset;
    if (this.version) query.version = this.version;
    const dataId = DataStorage.getDataId(query, this.readerObject, parsers);
    if (dataId) {
      if (!query.grouping) return Promise.resolve(dataId);
      return DataStorage.aggregateData(dataId, query, this.readerObject, this.getConceptprops());
    }
    utils.timeStamp("Vizabi Data: Loading Data");
    if (!sideLoad) {
      EventSource.freezeAll([
        "hook_change",
        "resize"
      ]);
    }

    return DataStorage.loadFromReader(query, parsers, this.readerObject)
      .then(dataId => {
        if (!query.grouping) return dataId;
        return DataStorage.aggregateData(dataId, query, this.readerObject, this.getConceptprops());
      })
      .then(dataId => {
        if (!sideLoad) EventSource.unfreezeAll();
        return dataId;
      })
      .catch(error => {
        if (!sideLoad) EventSource.unfreezeAll();
        this.handleLoadError(error);
      });
  },

  getAsset(assetName, callback) {
    return this.readerObject.getAsset(assetName)
      .then(response => callback(response))
      .catch(error => this.handleLoadError(error));
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

  loadDataAvailability() {
    const conceptsQuery = {
      select: {
        key: ["key", "value"],
        value: []
      },
      from: "concepts.schema"
    };
    const entitiesQuery = utils.extend({}, conceptsQuery, { from: "entities.schema" });
    const datapointsQuery = utils.extend({}, conceptsQuery, { from: "datapoints.schema" });

    return Promise.all([
      this.load(conceptsQuery),
      this.load(entitiesQuery),
      this.load(datapointsQuery)
    ])
      .then(this.handleDataAvailabilityResponse.bind(this))
      .catch(error => this.handleLoadError(error));
  },

  handleDataAvailabilityResponse(dataIds) {
    this.keyAvailability = new Map();
    this.dataAvailability = [];
    dataIds.forEach(dataId => {
      const collection = this.getData(dataId, "query").from.split(".")[0];
      this.dataAvailability[collection] = [];
      this.getData(dataId).forEach(kvPair => {
        const key = (typeof kvPair.key === "string" ? JSON.parse(kvPair.key) : kvPair.key).sort(); // sort to get canonical form (can be removed when reader gives back canonical)

        this.dataAvailability[collection].push({
          key: new Set(key),
          value: kvPair.value
        });

        this.keyAvailability.set(key.join(","), key);
      });
    });
  },

  loadConceptProps() {
    // only selecting concept properties which Vizabi needs and are available in dataset
    const vizabiConceptProps = [
      "concept_type",
      "domain",
      "totals_among_entities",
      "source_url",
      "source",
      "color",
      "scales",
      "interpolation",
      "tags",
      "name",
      "name_short",
      "name_catalog",
      "description",
      "format"
    ];
    const availableConceptProps = this.dataAvailability.concepts.map(m => m.value);
    const availableVizabiConceptProps = vizabiConceptProps.filter(n => availableConceptProps.includes(n));

    const query = {
      select: {
        key: ["concept"],
        value: availableVizabiConceptProps
      },
      from: "concepts",
      where: {},
      language: this.getClosestModel("locale").id,
    };

    return this.load(query)
      .then(this.handleConceptPropsResponse.bind(this))
      .catch(error => this.handleLoadError(error));
  },

  handleConceptPropsResponse(dataId) {

    this.conceptDictionary = { _default: { concept: "_default", concept_type: "string", use: "constant", scales: ["ordinal"], tags: "_root" } };
    this.conceptArray = [];

    this.getData(dataId).forEach(d => {
      const concept = {};

      concept["concept"] = d.concept;
      concept["concept_type"] = d.concept_type;
      concept["sourceLink"] = d.source_url;
      concept["sourceName"] = d.source;
      try {
        concept["color"] = d.color && d.color !== "" ? (typeof d.color === "string" ? JSON.parse(d.color) : d.color) : null; //
      } catch (e) {
        concept["color"] = null;
      }
      try {
        concept["scales"] = d.scales && d.color !== "" ? (typeof d.scales === "string" ? JSON.parse(d.scales) : d.scales) : null;
      } catch (e) {
        concept["scales"] = null;
      }
      if (!concept.scales) {
        switch (d.concept_type) {
          case "measure": concept.scales = ["linear", "log"]; break;
          case "string": concept.scales = ["ordinal"]; break;
          case "entity_domain": concept.scales = ["ordinal"]; break;
          case "entity_set": concept.scales = ["ordinal"]; break;
          case "boolean": concept.scales = ["ordinal"]; break;
          case "time": concept.scales = ["time"]; break;
          default: concept.scales = ["linear", "log"];
        }
      }
      if (d.interpolation) {
        concept["interpolation"] = d.interpolation;
      } else if (d.concept_type == "measure") {
        concept["interpolation"] = concept.scales && concept.scales[0] == "log" ? "exp" : "linear";
      } else if (d.concept_type == "time") {
        concept["interpolation"] = "linear";
      } else {
        concept["interpolation"] = "stepMiddle";
      }
      concept["domain"] = d.domain;
      concept["totals_among_entities"] = d.totals_among_entities;
      concept["tags"] = d.tags;
      concept["format"] = d.format;
      concept["name"] = d.name || d.concept || "";
      concept["name_catalog"] = d.name_catalog || "";
      concept["name_short"] = d.name_short || d.name || d.concept || "";
      concept["description"] = d.description;
      this.conceptDictionary[d.concept] = concept;
      this.conceptArray.push(concept);
    });

  },

  getConceptprops(which) {
    if (typeof which !== "undefined") {
      if (!this.conceptDictionary[which]) {
        utils.warn("The concept " + which + " is not found in the dictionary");
        return null;
      }
      return this.conceptDictionary[which];
    }
    return this.conceptDictionary;
  },

  getConcept({ index: index = 0, type: type = null, includeOnlyIDs: includeOnlyIDs = [], excludeIDs: excludeIDs = [] } = { }) {
    if (!type && includeOnlyIDs.length == 0 && excludeIDs.length == 0) {
      return null;
    }

    const filtered = this.conceptArray.filter(f =>
      (!type || !f.concept_type || f.concept_type === type)
      && (includeOnlyIDs.length == 0 || includeOnlyIDs.indexOf(f.concept) !== -1)
      && (excludeIDs.length == 0 || excludeIDs.indexOf(f.concept) == -1)
    );
    return filtered[index] || filtered[filtered.length - 1];
  },

  getDatasetName() {
    if (this.readerObject.getDatasetInfo) {
      const meta = this.readerObject.getDatasetInfo();
      return meta.name + (meta.version ? " " + meta.version : "");
    }
    return this._name.replace("data_", "");
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

  handleLoadError(error) {
    error.browserDetails = utils.getBrowserDetails();
    error.osName = utils.getOSname();
    error.homepoint = window.location.href;
    error.time = (new Date()).toString();
    this._super(error);
  },

});

export default DataModel;
