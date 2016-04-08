# ddf--gapminder_world

## source

1. concept file
   * all measure types except those from dont-panic-poverty data set: https://docs.google.com/spreadsheets/d/192pjt2vtwAQzi154LJ3Eb5RF8W9Fx3ZAiUZy-zXgyJo/edit#gid=3
   * dont-panic-poverty data set: don't have a concept file, extract the concepts from its data point file.
2. entities
   * country properities: There are 2 source files
     - https://github.com/Gapminder/waffle-server-importers-exporters/blob/world-legacy-with-data/data/synonym/country_synonyms.xlsx
     - https://github.com/open-numbers/ddf--gapminder--systema_globalis/blob/newdefinition/ddf--entities--geo--country.csv
     - Note: the country ids are not consistent in 2 files. use the ones in systema globalis
   * country groupings:
     - https://github.com/Gapminder/waffle-server-importers-exporters/blob/world-legacy-with-data/data/out/gw/meta/area_categorizarion.json
     - world_4region: https://github.com/open-numbers/ddf--gapminder--systema_globalis/blob/newdefinition/ddf--entities--geo--world_4region.csv
3. datapoints
   * all mesure types except those from dont-panic-poverty data set: 
     - each file represents one indicator in this folder: https://github.com/Gapminder/waffle-server-importers-exporters/tree/world-legacy-with-data/data/out/gw/indicators
     - the indicator names corresponded to file names: https://github.com/Gapminder/waffle-server-importers-exporters/blob/world-legacy-with-data/data/out/gw/meta/quantities.json
   * dont-panic-poverty data set: https://github.com/Gapminder/vizabi/blob/develop/.data/waffles/dont-panic-poverty.csv
4. metadata and translation file from vizabi
   * metadata: https://github.com/Gapminder/vizabi/blob/develop/.data/waffles/metadata.json
   * en.json: https://github.com/Gapminder/vizabi/blob/develop/.data/translation/en.json

## How to run the script

- change the symlink of indicators dir to your local copy of indicators dir
- go to script dir and run update.py to update other source files. Before you run the script please fill in the token string in line 11.

  ```
  cd script
  python update.py
  ```
  
- run main.py to generate files. you can choose which files you want to create: all, entities, concepts, datapoints, enjson, metadata

  ```
  $ python main.py all  # all ddf files and en.json and metadata.json
  $ python main.py entities  # only entities will be created
  $ python main.py concepts datapoints  # create countries and datapoints
  ```

only python 3 is tested for now, will do more testing soon.

## Implementation Notes

* concept properties of indicators (all measure types):
  - name should be ddf_name from source file
  - unit should be ddf_unit from source file
  - description should be tooltip from source file
  - interpolation should be interpolation from source file
  - scales should be based on scale from source file:
    - If scale = lin: ["linear", "log"]
    - If scale = log: ["log", "linear"]
    - If undefined: ["linear", "log"] (don’t leave empty!)
* Metadata.json and en.json
  - metadata.json is build from scratch using the source data
  - en.json is updated base on the source en.json and graph_settings spreadsheet.
  
