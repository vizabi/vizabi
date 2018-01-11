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

  getDataModels() {
    this.updateDataModels();
    return this.dataModels;
  },

  getDimensionValues(conceptID) {
    const query = {
      select: {
        key: [conceptID],
        value: []
      },
      from: "entities"
    };
    return Promise.all(
      [...this.getDataModels().values()].map(
        dataModel => dataModel.load(query).then(dataId => dataModel.getData(dataId))
      )
    );
  },

  // heuristic: if concept is typed as such in one of the datasources, it's of that type
  isConceptType(conceptID, concept_type) {
    for (const dataModel of this.getDataModels().values()) {
      if (dataModel.conceptDictionary[conceptID] && dataModel.conceptDictionary[conceptID].concept_type == concept_type)
        return true;
    }
    return false;
  },

  // assumption: all datasources have identical concept properties if they are set
  getConceptProperty(conceptID, property) {
    for (const dataModel of this.getDataModels().values()) {
      const concept = dataModel.getConceptprops(conceptID);
      if (concept && concept[property]) return concept[property];
    }
    return "Concept not found";
  }
};

function DataManager(model) {
  const dimMan = Object.create(DataManagerPrototype);
  dimMan.model = model;
  return dimMan;
}

export default DataManager;
