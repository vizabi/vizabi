import * as utils from "base/utils";

/* Factory pattern for object creation as in
 * https://medium.com/javascript-scene/javascript-factory-functions-vs-constructor-functions-vs-classes-2f22ceddf33e
 * https://medium.com/javascript-scene/common-misconceptions-about-inheritance-in-javascript-d5d9bab29b0a
 *
 * We may want to have one DimensionManager singleton object for Vizabi. That way entities can be shared throughout instances.
 */

const DimensionManagerPrototype = {

  model: null,
  dimensionModels: new Map(),

  updateDimensionModels() {
    this.dimensionModels.clear();
    utils.forEach(this.model.state._data, (model, name) => {
      if (typeof model.dim === "undefined") return;
      this.dimensionModels.set(name, model);
    });
  },

  getDimensionModelsForSpace(oldSpace, newSpaceDimensions) {

    this.updateDimensionModels();

    // match new space to entities
    // assumption:
    // - no overlapping dimensionModels between markers or changing dimension models is fine
    // - one entities model per dimension
    // - only one time model (state.time)
    const oldSpaceEntities = Object.keys(oldSpace).filter(dim => oldSpace[dim]._type == "entities");
    const newSpace = newSpaceDimensions.map((dim, index) => {

      /**
       * HEURISTIC 1: use old space and map new space on those entities (works only for same-dimensional)
       */
      let modelName;
      if (this.model.dataManager.isConceptType(dim, "time")) {
        modelName = "time";
        oldSpace[modelName].dim = dim;
      } else {
        modelName = oldSpaceEntities.pop();
        if (typeof modelName != "undefined") {
          // entities model found
          oldSpace[modelName].setDimension(dim);
        } else {
          // no more entities models left
          modelName = "entities_" + dim;
          const newEntities = {
            [modelName]: Object.assign(Entities.getClassDefaults(), { dim })
          };
          this.model.state.set(newEntities);
        }
      }
      return modelName;

      /**
       * HEURISTIC 2 (unused/untested): Look for entities models which already have dimensions, use time or create new entities model
       */

      // check if there is a entities model with this dimension, if so return it
      for (const [name, dimensionModel] of this.dimensionModels.entries()) {
        if (dimensionModel.dim == dim) {
          return name;
        }
      }

      // if time, change the one time model
      if (this.model.dataManager.isConceptType(dim, "time")) {
        // we expect only one time model and update this (baaad, but state.time is still hardcoded in quite some places)
        for (const [name, dimensionModel] of this.dimensionModels.entries()) {
          if (dimensionModel.type == "time") {
            dimensionModel.dim = dim;
            return name;
          }
        }
      }

      // for others, create entities model for new dimension
      const newEntities = {
        ["entities_" + dim]: Object.assign(Entities.getClassDefaults(), { dim })
      };
      this.model.state.set(newEntities);
      return "entities_" + dim;
    });

    return newSpace;

  },

  getAllParsers() {
    this.updateDimensionModels();

    const result = {};

    this.dimensionModels.forEach((model, name) => {
      const parser = model.getParser();
      const column = model._type === "time" ? "time" : model.getDimensionOrWhich();

      parser && column && !(column in result) && (result[column] = parser);

    });

    return result;
  }
};

function DimensionManager(model) {
  const dimMan = Object.create(DimensionManagerPrototype);
  dimMan.model = model;
  return dimMan;
}

export default DimensionManager;
