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

  getAvailableDataForKey(pKey, pValue, dataType) {
    this.updateDataModels();

    const result = [];
    for (const dataModel of this.dataModels.values()) {
      for (const { key, value } of (dataModel.dataAvailability || {})[dataType] || []) {
        if (key.has(pKey) && (!pValue || value === pValue)) {
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
          .then(dataId => dataModel.getData(dataId).map(m => { m.dataSourceName = dataModel._name; return m; }))
      )
    );
  },

  /**
   * Return tag entities with name and parents from all data sources
   * @return {array} Array of tag objects
   */
  getTags() {
    return this.getDimensionValues("tag", ["name", "parent"])
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
        const keyString = key.map(concept => row[concept]).join(",");
        if (!keys.has(keyString))
          keys.set(keyString, row);
      });
    });
    return Array.from(keys.values());
  }

};

function DataManager(model) {
  const dataMan = Object.create(DataManagerPrototype);
  dataMan.model = model;
  return dataMan;
}

export default DataManager;
