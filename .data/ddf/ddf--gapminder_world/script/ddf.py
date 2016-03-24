# -*- coding: utf-8 -*-
"""create ddf files for gapminder world data, from the origin
json version files.
"""

import pandas as pd
import numpy as np
import json
import re
import os
from common import to_concept_id


# helper functions

def rename_col(s, idt, concepts):
    '''map concept name to concept id'''
    real = idt[idt['-t-ind'] == s]['-t-name'].iloc[0]
    cid = concepts[concepts['full_name'] == real]['concept'].iloc[0]
    return cid


def rename_geo(s, geo_):
    """map gwid to iso code"""
    return geo_.get_value(s, 'ISO3dig_ext')  # geo_ will be defined below.

# Entities of country gourps

def extract_entities_groups(regs, gps):
    regd = {}  # a dictionary, which keys are region id and values are region names
    res = {}

    for i in regs:
        regd[i.get(list(i.keys())[0])] = list(i.keys())[0]

    for i, n in gps.n.apply(to_concept_id).iteritems():
        df = pd.DataFrame([], columns=[n, 'name', 'gwid', 'is--'+n])
        df['gwid'] = gps.iloc[i]['groupings'].keys()
        if i == 4:
            df[n] = df['gwid'].apply(lambda x: to_concept_id(regd[x], sub='[/ -\.\*";\[\]]+', sep=''))
        else:
            df[n] = df['gwid'].apply(lambda x: to_concept_id(regd[x], sub='[/ -\.\*";\[\]]+'))

            df['name'] = df['gwid'].apply(lambda x: regd[x])
        df['is--'+n] = 'TRUE'
        res[n] = df

        # df.to_csv(os.path.join(out_dir, 'ddf--entities--geo--'+n+'.csv'), index=False, encoding='utf8')
    return res

# Entities of Country
def extract_entities_country(regs, geo, gps, geo_sg):
    regd = {}
    for i in regs:
        regd[i.get(list(i.keys())[0])] = list(i.keys())[0]

    geo_ = geo[['ISO3dig_ext', 'Gwid']]
    geo_ = geo_.set_index('Gwid')
    geo_2 = geo.set_index('Gwid').drop('ISO3dig_ext', axis=1)

    country = geo_.copy()

    for i, n in gps.n.apply(to_concept_id).iteritems():

        res = {}

        for k, v in gps.iloc[i]['groupings'].items():
            for c in v:
                if c:
                    if i == 4:
                        res[c] = to_concept_id(regd[k], sub='[/ -\.\*";\[\]]+', sep='')
                    else:
                        res[c] = to_concept_id(regd[k], sub='[/ -\.\*";\[\]]+')

        ser = pd.Series(res)

        country[n] = ser

    country2 = pd.concat([country, geo_2], axis=1)
    country2 = country2.reset_index()
    country2 = country2.rename(columns={'NAME': 'Upper Case Name', 'Use Name': 'Name', 'ISO3dig_ext': 'country_2'})
    country2.columns = list(map(to_concept_id, country2.columns))
    country2['is--country'] = 'TRUE'

    country3 = geo_sg[['geo', 'world_4region', 'latitude', 'longitude', 'name']]
    country3 = country3.rename(columns={'geo': 'country'}).set_index('name')

    country4 = pd.concat([country2.set_index('name'), country3], axis=1)
    country4 = country4.reset_index()
    country4 = country4.rename(columns={'index': 'name'})
    country4 = country4.drop('country_2', axis=1)

    cols = country4.columns.drop(['country', 'gwid', 'name'])
    ex_col = np.r_[['country', 'gwid', 'name'], cols]
    return country4.loc[:, ex_col]

# TODO: below functions not completed yet.
# concepts

def cleanup_concepts(concepts, drop_placeholder=False):
    cs = concepts.copy()
    cs.columns = list(map(to_concept_id, cs.columns))
    cs['concept_type'] = 'measure'
    cs = cs.drop(['download', 'old_ddf_id'], axis=1)
    cs = cs.iloc[:, [5, 0, 1,2,3,4,6,7, 8, 9, 10]]
    cs = cs.rename(columns={'ddf_id':'concept', 'name': 'full_name','ddf_name':'name', 'ddf_unit': 'unit', 'tooltip': 'description'})
    if drop_placeholder:
        k = cs[cs.concept == u'———————————————————————'].index
        cs = cs.drop(k)

    return cs


def extract_concepts(concepts, geo, gps, sgdc, mdata):
    concepts = concepts.rename(columns={'ddf_id':'Concept', 'Name': 'Full Name','ddf_name':'Name', 'ddf_unit': 'Unit', 'Tooltip': 'Description'})
    dsc = concepts.columns
    dsc = dsc.drop(['Download', 'old_ddf_id', 'Menu level1', 'Menu level 2', 'Scale'])

    concepts.columns = list(map(to_concept_id, concepts.columns))
    concepts['concept_type'] = 'measure'
    concepts = concepts.drop(['download', 'old_ddf_id'], axis=1)
    concepts = concepts.iloc[:, [5, 0, 1,2,3,4,6,7, 8, 9, 10]]
    cc = concepts[['concept', 'name', 'concept_type', 'description', 'indicator_url', 'scale', 'unit', 'interpolation']].copy()
    k = concepts[concepts.concept == u'———————————————————————'].index
    cc = cc.drop(k)
    cc['drill_up'] = np.nan
    cc['domain'] = np.nan
    cc['scales'] = cc['scale'].apply(lambda x: ['log', 'linear'] if x=='log' else ['linear', 'log'])

    rm = {'gini': 'sg_gini',
          'population': 'sg_population',
          'gdp_p_cap_const_ppp2011_dollar': 'sg_gdp_p_cap_const_ppp2011_dollar'
    }

    cc2 = pd.DataFrame([], columns=cc.columns)
    cc2.concept = rm.values()
    cc2['name'] = cc2.concept
    cc2['concept_type'] = 'measure'
    cc2['indicator_url'] = cc2['concept'].apply(lambda x: mdata['indicatorsDB'][x[3:]]['sourceLink'])
    cc2['scales'] = cc2['concept'].apply(lambda x: mdata['indicatorsDB'][x[3:]]['scales'])

    dc = pd.DataFrame([], columns=cc.columns)
    dcl = list(map(to_concept_id, gps.n.values))

    geo = geo.rename(columns={'NAME': 'Upper Case Name', 'Use Name': 'Name'})
    ccs = geo.columns.drop(['Name', 'ISO3dig_ext'])
    ccs_id = list(map(to_concept_id, ccs))

    w4r_name = sgdc[sgdc['concept'] == 'world_4region']['name'].iloc[0]

    dcl_ = np.r_[dcl, ['geo', 'country','time', 'name', 'gwid', 'name_short', 'name_long', 'description'],
                 ccs_id, ['indicator_url', 'scales', 'unit', 'interpolation', 'world_4region', 'latitude', 'longitude'] ]
    dcl_2 = np.r_[gps.n.values, ['Geo', 'Country','Time', 'Name', 'Gwid', 'Name Short', 'Name Long', 'Description'],
                  ccs, ['Indicator Url', 'Scales', 'Unit', 'Interpolation', w4r_name, 'Latitude', 'Longitude']]

    dc['concept'] = dcl_
    dc['name'] = dcl_2

    dc['concept_type'] = 'string'
    dc.loc[:5, 'concept_type'] = 'entity_set'
    dc.loc[6, 'concept_type'] = 'entity_domain'
    dc.loc[7, 'concept_type'] = 'entity_set'
    dc.loc[8, 'concept_type'] = 'time'
    dc.loc[36, 'concept_type'] = 'entity_set'
    dc.loc[[37,38], 'concept_type'] = 'measure'
    dc.loc[[37,38], 'unit'] = 'degrees'
    dc.loc[37, 'scale'] = 'lat'
    dc.loc[38, 'scale'] = 'long'

    dc.loc[:5, 'domain'] = 'geo'
    dc.loc[7, 'drill_up'] = dcl
    dc.loc[7, 'domain'] = 'geo'
    dc.loc[36, 'domain'] = 'geo'

    c_all = pd.concat([dc, cc, cc2])
    c_all = c_all.drop('scale', axis=1)

    return c_all


# Datapoints
def extract_datapoints(data_source, idt, concepts, geo):
    # res = {}
    geo_ = geo[['ISO3dig_ext', 'Gwid']]
    geo_ = geo_.set_index('Gwid')
    fs = os.listdir(data_source)
    for f in fs[1:]:
        p = os.path.join(data_source, f)

        col = f[:-5]  # get indicator name
        col_r = rename_col(col, idt, concepts)  # get indicator's id

        d = pd.read_json(p)

        if 'geo' in d.columns:
            d['geo'] = d['geo'].apply(lambda x: rename_geo(x, geo_))
            d = d.rename(columns={col: col_r})
            # d.to_csv(os.path.join(out_dir, 'ddf--datapoints--'+col_r+'--by--geo--time.csv'), index=False, encoding='utf8')
            # res[col_r] = d
            yield (col_r, d)
        else:
            # print('passed empty data file for ', col_r)
            continue

    # return res
