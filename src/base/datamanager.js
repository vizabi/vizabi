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
        dataModel => dataModel.load(query, undefined, true).then(dataId => dataModel.getData(dataId))
      )
    );
  },
};

function DataManager(model) {
  const dimMan = Object.create(DataManagerPrototype);
  dimMan.model = model;
  return dimMan;
}

export default DataManager;
