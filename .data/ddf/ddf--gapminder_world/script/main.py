# -*- coding: utf-8 -*-

import pandas as pd
import json
import os
from ddf import (extract_entities_groups, extract_entities_country,
                 extract_datapoints, cleanup_concepts, extract_concepts)
from vizabi import update_enjson, generate_metadata

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

# datapoint folder
dps_f = 'indicators'


def main(source_dir, out_dir):
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
    mdata = json.load(open(os.path.join(source_dir, mdata_f)))

    # build ddf
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

    # 3. datapoints
    print('creating datapoints...')
    concepts_ = cleanup_concepts(concepts)
    # dp = extract_datapoints(os.path.join(source_dir, dps_f), idt, concepts_, geo)
    for k, dp in extract_datapoints(os.path.join(source_dir, dps_f), idt, concepts_, geo):
        path = os.path.join(out_dir, 'ddf', 'ddf--datapoints--'+k+'--by--geo--time.csv')
        dp.to_csv(path, index=False, encoding='utf-8')

    # 4. concepts
    print('creating concepts...')
    cs = extract_concepts(concepts, geo, gps, sgdc, mdata)
    path = os.path.join(out_dir, 'ddf', 'ddf--concepts.csv')
    cs.to_csv(path, index=False, encoding='utf-8')

    # 5. update en.json
    print('updating en.json...')
    concepts_ = cleanup_concepts(concepts, drop_placeholder=True)
    new_enj = update_enjson(enj, cs, concepts_)
    with open(os.path.join(out_dir, 'vizabi', 'en.json'), 'w') as f:
        json.dump(new_enj, f, indent=1, sort_keys=True)
        f.close()

    # 6. update metadata.json
    print('updating metadata.json')
    md = generate_metadata(cs, concepts_, mdata, area, out_dir)
    with open(os.path.join(out_dir, 'vizabi', 'metadata.json'), 'w') as f:
        json.dump(md, f, indent=1)
        f.close()

if __name__ == '__main__':
    main('../source/', '../output/')
