# -*- coding: utf-8 -*-

import pandas as pd
import json
import os
from shutil import copy
from ddf import (extract_entities_groups, extract_entities_country,
                 extract_datapoints, cleanup_concepts, extract_concepts)
from vizabi import update_enjson, generate_metadata
from index import create_index_file

# source files to be read. More can be found in README in this repo.
# indicator name and their hash names.
idt_f = 'quantities.json'
# groupings, there are 5 ways of grouping of countries in the data set.
gps_f = 'area_categorizarion.json'
# Country properities
geo_f = 'country_synonyms.xlsx'
# Region properities
reg_f = 'regions.json'
# indicator properities
concept_f = 'graph_settings - Indicators.csv'
# old en.json, to be updated
enj_f = 'en.json'
# dont-panic-poverty data points
dpp_f = 'dont-panic-poverty.csv'
# discrete concept list from systema_globalis.
# we only use this file to get the world_4region concept
sgdc_f = 'ddf--concepts--discrete.csv'
# country properities from systema_globalis
geo_sg_f = 'ddf--entities--geo--country.csv'
# old metadata.json
mdata_f = 'metadata.json'
# geo--global
global_f = 'ddf--entities--geo--global.csv'
# world_4region
w4r_f = 'ddf--entities--geo--world_4region.csv'

# datapoint folder
dps_f = 'indicators'


def main(source_dir, out_dir, make='all'):
    # read files
    idt = pd.read_json(os.path.join(source_dir, idt_f))
    gps = pd.read_json(os.path.join(source_dir, gps_f))
    area = json.load(open(os.path.join(source_dir, gps_f)))
    geo = pd.read_excel(os.path.join(source_dir, geo_f))
    regs = json.load(open(os.path.join(source_dir, reg_f)))
    concepts = pd.read_csv(os.path.join(source_dir, concept_f), encoding='utf8')
    enj = json.load(open(os.path.join(source_dir, enj_f)))
    dpp = pd.read_csv(os.path.join(source_dir, dpp_f))
    sgdc = pd.read_csv(os.path.join(source_dir, sgdc_f))
    geo_sg = pd.read_csv(os.path.join(source_dir, geo_sg_f), encoding='latin')
    # quick fix: there is a line break in the name of United Korea
    geo_sg['name'] = geo_sg['name'].apply(lambda x: x.strip('\n'))
    mdata = json.load(open(os.path.join(source_dir, mdata_f)))

    if make == 'all':
        make = ['entities', 'datapoints', 'concepts', 'metadata', 'enjson']

    # build ddf
    if 'entities' in make:
        make.remove('entities')
        # 1. entities for country groupings
        print('creating entities...')
        g = extract_entities_groups(regs, gps)
        for k, v in g.items():
            path = os.path.join(out_dir, 'ddf/', 'ddf--entities--geo--'+k+'.csv')
            v.to_csv(path, index=False, encoding='utf-8')

        # 2. entities for countries
        c = extract_entities_country(regs, geo, gps, geo_sg)
        path = os.path.join(out_dir, 'ddf', 'ddf--entities--geo--country.csv')
        c.to_csv(path, index=False, encoding='utf-8')

        # just copy the global and world_4region entities
        copy(os.path.join(source_dir, global_f), os.path.join(out_dir, 'ddf'))
        copy(os.path.join(source_dir, w4r_f), os.path.join(out_dir, 'ddf'))

    # 3. datapoints
    if 'datapoints' in make:
        make.remove('datapoints')
        print('creating datapoints...')
        concepts_ = cleanup_concepts(concepts)
        geomap = extract_entities_country(regs, geo, gps, geo_sg, geo_map=True)
        # dp = extract_datapoints(os.path.join(source_dir, dps_f), idt, concepts_, geo)
        for k, dp in extract_datapoints(os.path.join(source_dir, dps_f), dpp, idt, concepts_, geo, geomap):
            path = os.path.join(out_dir, 'ddf', 'ddf--datapoints--'+k+'--by--geo--time.csv')
            dp.to_csv(path, index=False, encoding='utf-8')

    # 4. concepts
    if 'concepts' in make:
        make.remove('concepts')
        print('creating concepts...')
        cs = extract_concepts(concepts, geo, gps, sgdc, mdata)
        path = os.path.join(out_dir, 'ddf', 'ddf--concepts.csv')
        cs.to_csv(path, index=False, encoding='utf-8')

    # 5. update en.json
    if 'enjson' in make:
        make.remove('enjson')
        print('updating en.json...')
        concepts_ = cleanup_concepts(concepts, drop_placeholder=True)
        cs = extract_concepts(concepts, geo, gps, sgdc, mdata)
        new_enj = update_enjson(enj, cs, concepts_)
        with open(os.path.join(out_dir, 'vizabi', 'en.json'), 'w') as f:
            json.dump(new_enj, f, indent=1, sort_keys=True)
            f.close()

    # 6. update metadata.json
    if 'metadata' in make:
        make.remove('metadata')
        print('updating metadata.json')
        concepts_ = cleanup_concepts(concepts, drop_placeholder=True)
        cs = extract_concepts(concepts, geo, gps, sgdc, mdata)
        md = generate_metadata(cs, concepts_, mdata, area, out_dir)
        with open(os.path.join(out_dir, 'vizabi', 'metadata.json'), 'w') as f:
            json.dump(md, f, indent=1)
            f.close()

    # 7. index file
    if 'index' in make:
        make.remove('index')
        print('generating index file')
        path = os.path.join(out_dir, 'ddf')
        create_index_file(path, os.path.join(path, 'ddf--index.csv'))

    if len(make) > 0:
        print('command not recognized: ' + str(make))
        return -1

    return 1

if __name__ == '__main__':
    import sys
    make = sys.argv[1:]
    if len(make) == 0:
        make = 'all'
    elif 'all' in make:
        make = 'all'
    r = main('../source/', '../output/', make)
    if r > 0:
        print('Done.')
