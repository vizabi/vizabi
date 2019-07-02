import * as utils from "base/utils";

const DataManagerPrototype = {

  model: null,
  dataModels: new Map(),

  getDataModels() {
    this.updateDataModels();
    return this.dataModels;
  },

  updateDataModels() {
    this.dataModels.clear();
    utils.forEach(this.model._data, (model, name) => {
      if (model._type != "data") return;
      this.dataModels.set(name, model);
    });
  },

  // heuristic: if concept is typed as such in one of the datasources, it's of that type
  isConceptType(conceptID, concept_type) {
    this.updateDataModels();
    for (const dataModel of this.dataModels.values()) {
      if (dataModel.conceptDictionary[conceptID] && dataModel.conceptDictionary[conceptID].concept_type == concept_type)
        return true;
    }
    return false;
  },

  // assumption: all datasources have identical concept properties if they are set
  getConceptProperty(conceptID, property) {
    this.updateDataModels();
    for (const dataModel of this.dataModels.values()) {
      const concept = dataModel.getConceptprops(conceptID);
      if (concept && concept[property]) return concept[property];
    }
    return "Concept not found";
  },

  getCollectionFromKey(pKey) {
    if (pKey.length > 1) return "datapoints";
    else if (pKey[0] == "concept") return "concepts";
    return "entities";
  },

  getAvailabilityForMarkerKey(key) {
    const results = new Map();

    const addResult = (kvPair, dataModel) => {
      const keyString = this.createKeyString(["key", "value"], kvPair);
      const indicatorsDB = dataModel.getConceptprops();

      results.set(keyString, {
        key: kvPair.key.map(concept => indicatorsDB[concept]),
        value: indicatorsDB[kvPair.value],
        dataSource: dataModel
      });
    };

    // joins availability of datamodels
    // assumes datamodels always have same data
    for (const dataModel of this.dataModels.values()) {

      dataModel.dataAvailability.datapoints.forEach(kvPair => {
        if (key.length == kvPair.key.size && key.every(dim => kvPair.key.has(dim))) {
          addResult({ key: Array.from(kvPair.key), value: kvPair.value }, dataModel);
        }
      });

      // get all available entity properties for current marker space
      dataModel.dataAvailability.entities.forEach(kvPair => {
        if (kvPair.value == null) return;

        key.forEach(dim => {
          if (kvPair.key.has(dim) && kvPair.value.indexOf("is--") === -1) {
            addResult({ key: [dim], value: kvPair.value }, dataModel);
          }
        });
      });

    }

    return Array.from(results.values());
  },

  getAvailableDataForKey(pKey, pValue = false) {
    this.updateDataModels();

    if (!Array.isArray(pKey)) pKey = [pKey];
    const collection = this.getCollectionFromKey(pKey);
    const result = [];
    for (const dataModel of this.dataModels.values()) {
      for (const { key, value } of (dataModel.dataAvailability || {})[collection] || []) {
        if (key.size === pKey.length && pKey.every(_pKey => key.has(_pKey)) && (!pValue || value === pValue)) {
          result.push({ data: dataModel._name, key: pKey, value });
        }
      }
    }

    return result;
  },

  getDimensionValues(conceptID, value = [], queryAddition = {}) {
    const query = Object.assign({
      select: {
        key: [conceptID],
        value
      },
      from: "entities"
    }, queryAddition);
    return Promise.all(
      [...this.getDataModels().values()].filter(ds => ds.getConceptprops(conceptID)).map(
        dataModel => dataModel.load(query, undefined, true)
          .then(dataId => {
            if (dataModel.getData(dataId) instanceof Error) {
              console.log("❌ Got something wrong with this data, as either key or values might not be found on the server, see details below (query, dataid and the content that came back), placeholdering with empty array instead", query, dataId, dataModel.getData(dataId));
              return [];
            }
            return dataModel.getData(dataId).map(m => { m.dataSourceName = dataModel._name; return m; });
          })
      )
    );
  },

  /**
   * Return tag entities with name and parents from all data sources
   * @return {array} Array of tag objects
   */
  getTags(locale) {
    return this.getDimensionValues("tag", ["name", "parent"], { language: locale })
      .then(results => this.mergeResults(results, ["tag"])); // using merge because key-duplicates terribly slow down treemenu
  },

  /**
   * Concat query results. Does not care about keys and key collisions. Only use when key-collisions are accepted or not expected.
   * @param  {[type]} results [description]
   * @return {[type]}         [description]
   */
  concatResults(results) {
    return results.reduce(
      (accumulator, current) => accumulator.concat(current)
    );
  },

  /**
   * Merges query results. The first result is base, subsequent results are only added if key is not yet in end result.
   * @param  {array of arrays} results Array where each element is a result, each result is an array where each element is a row
   * @param  {array} key     primary key to each result
   * @return {array}         merged results
   */
  mergeResults(results, key) {
    const keys = new Map();
    results.forEach(result => {
      result.forEach(row => {
        const keyString = this.createKeyString(key, row);
        if (!keys.has(keyString))
          keys.set(keyString, row);
      });
    });
    return Array.from(keys.values());
  },

  createKeyString(key, row) {
    return key.map(concept => row[concept]).join(",");
  }

};

function DataManager(model) {
  const dataMan = Object.create(DataManagerPrototype);
  dataMan.model = model;
  return dataMan;
}

export default DataManager;
