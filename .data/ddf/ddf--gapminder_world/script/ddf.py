# -*- coding: utf-8 -*-
"""create ddf files for gapminder world data, from the origin
json version files.
"""

import pandas as pd
import numpy as np
import os
from common import to_concept_id


# helper functions
def rename_col(s, idt, concepts):
    '''map concept name to concept id.

    idt: DataFrame containing concept name and hashed file name.
    concepts: DataFrame containing concept name and concept id.
    '''
    real = idt[idt['-t-ind'] == s]['-t-name'].iloc[0]
    try:
        cid = concepts[concepts['full_name'] == real]['concept'].iloc[0]
    except:
        print('concept not found: ', real)
        raise
    return cid


def rename_geo(s, gwidmap, isomap):
    """map gwid to iso code as used in systema_globalis repo.

    gwidmap: DataFrame containing gwid and iso digit codes
    isomap: DataFrame containing the old and new iso codes for each country
    """
    iso = gwidmap.ix[s]['ISO3dig_ext']
    return isomap.ix[iso].values


# Entities of country gourps
def extract_entities_groups(regs, gps):
    """extract all country groups entities

    regs: regions.json, contains country/region name and gwid.
    gps: area_categorizarion.json, contains groups name and group levels

    returns a dictionary which keys are group name and values are dataframes.
    """
    res = {}

    regd = {}  # a dictionary, which keys are region id and values are region names
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
    return res


# Entities of Country
def extract_entities_country(regs, geo, gps, geo_sg, geo_map=False):
    """if geo_map is True, return a geomap which maps the old country id to new id
    else return the country entities with new id.

    regs: regions.json, contains country/region name and gwid.
    geo: country_synonyms.xlsx, contains all country info
    gps: area_categorizarion.json, contains groups name and group levels
    geo_sg: country entities from systema_globalis
    """
    regd = {}
    for i in regs:
        regd[i.get(list(i.keys())[0])] = list(i.keys())[0]

    geo_ = geo[['ISO3dig_ext', 'Gwid']]
    geo_ = geo_.set_index('Gwid')
    geo_2 = geo.set_index('Gwid').drop('ISO3dig_ext', axis=1)

    country = geo_.copy()

    # loop though all groupings, build a dataframe which gwid is the index and
    # group names are columns.
    for i, n in gps.n.apply(to_concept_id).iteritems():
        res = {}

        for k, v in gps.iloc[i]['groupings'].items():
            for gwid in v:
                if gwid:
                    res[gwid] = to_concept_id(regd[k], sub='[/ -\.\*";\[\]]+')

        ser = pd.Series(res)

        country[n] = ser

    # combine the groupings info and other info, and do some cleanups.
    country2 = pd.concat([country, geo_2], axis=1)
    country2 = country2.reset_index()
    country2 = country2.rename(columns={'NAME': 'Upper Case Name', 'Use Name': 'Name', 'ISO3dig_ext': 'country_2'})
    country2.columns = list(map(to_concept_id, country2.columns))
    country2['is--country'] = 'TRUE'

    # adding world_4region data
    country3 = geo_sg[['geo', 'world_4region', 'latitude', 'longitude', 'name']]
    country3 = country3.rename(columns={'geo': 'country'}).set_index('name')

    # the final dataframe
    country4 = pd.concat([country2.set_index('name'), country3], axis=1)
    country4 = country4.reset_index()
    country4 = country4.rename(columns={'index': 'name'})

    if not geo_map:
        country4 = country4.drop('country_2', axis=1)
        cols = country4.columns.drop(['country', 'gwid', 'name'])
        ex_col = np.r_[['country', 'gwid', 'name'], cols]
        return country4.loc[:, ex_col]
    else:
        country4 = country4.set_index('country_2')
        return country4['country']


# concepts
def cleanup_concepts(concepts, drop_placeholder=False):
    """rename the columns and remove placeholder from graphing settings data."""
    cs = concepts.copy()
    cs.columns = list(map(to_concept_id, cs.columns))
    cs['concept_type'] = 'measure'
    cs = cs.drop(['download'], axis=1)
    # get only columns needed
    cs = cs.loc[:, ['ddf_id', 'name', 'tooltip', 'menu_level1', 'menu_level_2',
                    'indicator_url', 'scale', 'ddf_name', 'ddf_unit', 'interpolation',
                    'concept_type']]
    cs = cs.rename(columns={'ddf_id': 'concept', 'name': 'full_name',
                            'ddf_name': 'name', 'ddf_unit': 'unit',
                            'tooltip': 'description'})
    if drop_placeholder:
        k = cs[cs.concept == u'———————————————————————'].index
        cs = cs.drop(k)

    return cs


def extract_concepts(cs, geo, gps, sgdc, mdata):
    """extract all concepts.

    cs: all measure type concepts, from graph_settings file.
    geo: country_synonyms.xlsx, contains all country info
    gps: area_categorizarion.json, contains groups name and group levels
    sgdc: discrete concept file from systema_globals
    mdata: metadata.json
    """
    # columns needed
    cols = ['concept', 'name', 'concept_type', 'description', 'indicator_url', 'scale', 'unit', 'interpolation']

    # build continuous concepts dataframe
    concepts = cs.rename(columns={'ddf_id': 'Concept', 'Name': 'Full Name',
                                  'ddf_name': 'Name', 'ddf_unit': 'Unit',
                                  'Tooltip': 'Description'}).copy()

    # dsc_name will be use later in creation of discrete concepts dataframe.
    dsc_name = concepts.columns
    dsc_name = dsc_name.drop(['Download', 'Menu level1', 'Menu level 2', 'Scale', 'Concept', 'Full Name'])
    dsc_col = list(map(to_concept_id, dsc_name))

    concepts.columns = list(map(to_concept_id, concepts.columns))
    concepts['concept_type'] = 'measure'
    concepts = concepts.loc[:, cols]  # only keep columns needed

    cc = concepts.copy()
    k = concepts[concepts.concept == u'———————————————————————'].index
    cc = cc.drop(k)
    cc['drill_up'] = np.nan
    cc['domain'] = np.nan
    cc['scales'] = cc['scale'].apply(lambda x: ['log', 'linear'] if x == 'log' else ['linear', 'log'])

    # here are concepts from dont-panic-poverty data set.
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

    # now build discrete concepts dataframe
    dc = pd.DataFrame([], columns=cc.columns)
    dcl = list(map(to_concept_id, gps.n.values))

    geo = geo.rename(columns={'NAME': 'Upper Case Name', 'Use Name': 'Name'})
    ccs = geo.columns.drop(['Name', 'ISO3dig_ext'])
    ccs_id = list(map(to_concept_id, ccs))

    w4r_name = sgdc[sgdc['concept'] == 'world_4region']['name'].iloc[0]

    # manually add more discrete concepts.
    manually = ['geo', 'country', 'name_short', 'name_long',
                'world_4region', 'latitude', 'longitude', 'global', 'color', 'time']
    manually_name = ['Geo', 'Country', 'Name Short', 'Name Long',
                     w4r_name, 'Latitude', 'Longitude', 'World', 'Color', 'Time']

    dcl_ = np.r_[dcl, dsc_col, manually, ccs_id]
    dcl_2 = np.r_[gps.n.values, dsc_name, manually_name, ccs]

    dc['concept'] = dcl_
    dc['name'] = dcl_2

    dc = dc.set_index('concept')
    dc['concept_type'] = 'string'

    dc.loc[dcl, 'concept_type'] = 'entity_set'  # all groups
    dc.loc[dcl, 'domain'] = 'geo'

    dc.loc['geo', 'concept_type'] = 'entity_domain'  # geo

    dc.loc['country', 'concept_type'] = 'entity_set'  # country
    dc.loc['country', 'drill_up'] = dcl
    dc.loc['country', 'domain'] = 'geo'

    dc.loc['time', 'concept_type'] = 'time' # time

    dc.loc['world_4region', 'concept_type'] = 'entity_set'  # world_4region
    dc.loc['world_4region', 'domain'] = 'geo'

    dc.loc[['latitude', 'longitude'], 'concept_type'] = 'measure'  # latitude and longitude
    dc.loc[['latitude', 'longitude'], 'unit'] = 'degrees'
    dc.loc['latitude', 'scale'] = 'lat'
    dc.loc['longitude', 'scale'] = 'long'

    dc.loc['global', 'domain'] = 'geo'  # global
    dc.loc['global', 'concept_type'] = 'entity_set'

    dc = dc.reset_index()

    # combine them all.
    c_all = pd.concat([dc, cc, cc2])
    c_all = c_all.drop('scale', axis=1)

    return c_all


# Datapoints
def extract_datapoints(data_source, dpp, idt, concepts, geo, geomap):
    """yields each datapoint dataframe from files in indicators dir

    data_source: indicators data dir
    idt: DataFrame containing concept name and hashed file name.
    dpp: dont-panic-poverty data set.
    """
    geo_ = geo[['ISO3dig_ext', 'Gwid']]
    geo_ = geo_.set_index('Gwid')

    # process all json file in data_source dir.
    fs = os.listdir(data_source)
    for f in fs:
        if '.json' not in f:
            continue

        p = os.path.join(data_source, f)

        col = f[:-5]  # get indicator file name
        try:
            col_r = rename_col(col, idt, concepts)  # get indicator's id
        except:
            continue

        d = pd.read_json(p)

        if 'geo' in d.columns:
            d['geo'] = rename_geo(d['geo'], geo_, geomap)
            d = d.rename(columns={col: col_r})
            yield (col_r, d)
        else:  # it's empty.
            continue

    # process the dont-panic-poverty data file.
    rm = {'gini': 'sg_gini',
          'population': 'sg_population',
          'gdp_p_cap_const_ppp2011_dollar': 'sg_gdp_p_cap_const_ppp2011_dollar'
          }
    dpp = dpp.rename(columns=rm)
    for k in rm.values():
        df = dpp[['geo', 'time', k]].dropna().sort_values(by=['geo', 'time'])
        yield (k, df)
