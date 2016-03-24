# -*- coding: utf-8 -*-
"""update meta.json and en.json with latest data"""


import pandas as pd
import numpy as np
import re
import os
import json
from common import to_concept_id, to_dict_dropna
from collections import OrderedDict


def update_enjson(enj, c_all, concepts):
    trs = c_all[['concept', 'name', 'unit', 'description']]
    trs = trs.iloc[6:-3].copy()
    trs['key_1'] = 'indicator/'+trs['concept']
    trs['key_2'] = 'unit/'+trs['concept']
    trs['key_3'] = 'description/'+trs['concept']

    trs1 = trs.drop('concept', axis=1).set_index('key_1')
    trs2 = trs.drop('concept', axis=1).set_index('key_2')
    trs3 = trs.drop('concept', axis=1).set_index('key_3')

    enj.update(trs1['name'].dropna().to_dict())
    enj.update(trs2['unit'].dropna().to_dict())
    enj.update(trs3['description'].dropna().to_dict())

    c_all4 = concepts[['concept', 'menu_level1', 'menu_level_2']]

    l1 = c_all4['menu_level1'].unique()
    l2 = c_all4['menu_level_2'].unique()

    for i in l1:
        if i is not np.nan:
            key = to_concept_id(i)
            enj['indicator/'+key] = i

    for i in l2:
        if i is not np.nan:
            key = to_concept_id(i)
            enj['indicator/'+key] = i

    c5 = c_all[c_all['concept_type'] == 'entity_set'].copy()
    for i, v in c5.iterrows():
        enj['indicator/'+'geo.'+v['concept']] = v['name']

    enj['indicator/sg_population'] = enj['indicator/population']
    enj['indicator/sg_gini'] = enj['indicator/gini']
    enj['indicator/sg_gdp_p_cap_const_ppp2011_dollar'] = enj['indicator/gdp_p_cap_const_ppp2011_dollar']

    enj['unit/sg_population'] = enj['unit/population']
    enj['unit/sg_gini'] = enj['unit/gini']
    enj['unit/sg_gdp_p_cap_const_ppp2011_dollar'] = enj['unit/gdp_p_cap_const_ppp2011_dollar']

    return enj


def generate_metadata(c_all, concepts, meta2, area, outdir, oneset=False):
    mdata = c_all[c_all['concept_type'] == 'measure'][['concept', 'indicator_url', 'scales', 'interpolation']]
    mdata = mdata.set_index('concept')
    mdata = mdata.drop(['longitude', 'latitude'])
    mdata.columns = ['sourceLink', 'scales', 'interpolation']
    mdata['use'] = 'indicator'

    indb = OrderedDict([['indicatorsDB', {}]])
    # indb = {'indicatorsDB': {}}
    indb['indicatorsDB'].update(to_dict_dropna(mdata))

    rm = {'gini': 'sg_gini',
          'population': 'sg_population',
          'gdp_p_cap_const_ppp2011_dollar': 'sg_gdp_p_cap_const_ppp2011_dollar'
    }
    panic = dict([[rm[i],meta2['indicatorsDB'][i]] for i in rm.keys()])
    indb['indicatorsDB'].update(panic)

    geomd = {'geo.world_4region': meta2['indicatorsDB']['geo.region']}
    indb['indicatorsDB'].update(geomd)

    if not oneset:
        res = {}

        for i in range(len(area)):
            key = to_concept_id(area[i]['n'])
            source = area[i]['sourceName']

            res['geo.'+key] = {'use': 'property', 'scales': ['ordinal'], 'sourceLink': source}
        indb['indicatorsDB'].update(res)

    for i in indb['indicatorsDB'].keys():
        fname = os.path.join(outdir, 'ddf', 'ddf--datapoints--'+i+'--by--geo--time.csv')
        try:
            df = pd.read_csv(fname, dtype={i:float, 'time': int})
        except OSError:
            print('no data for', i)
            continue

        dm = [float(df[i].min()), float(df[i].max())]
        av = [int(df['time'].min()), int(df['time'].max())]

        indb['indicatorsDB'][i].update({'domain': dm, 'availability': av})

    # newdb = OrderedDict([[key, indb['indicatorsDB'][key]] for key in sorted(indb['indicatorsDB'].keys())])
    # indb['indicatorsDB'] = newdb

    indb['indicatorsTree'] = OrderedDict([['id', '_root'], ['children', []]])
    ti = OrderedDict([['id', 'time']])
    pro = OrderedDict([['id', '_properties'], ['children', [{'id': 'geo'}, {'id': 'geo.name'}]]])

    indb['indicatorsTree']['children'].append(ti)
    c_all3 = concepts[['concept', 'menu_level1', 'menu_level_2']].sort_values(['menu_level1', 'menu_level_2'], na_position='first')

    c_all3['menu_level1'] = c_all3['menu_level1'].apply(to_concept_id).fillna('0')
    c_all3['menu_level_2'] = c_all3['menu_level_2'].apply(to_concept_id).fillna('1')

    c_all3 = c_all3.set_index('concept')

    g = c_all3.groupby('menu_level1').groups

    ks = list(sorted(g.keys()))

    if 'for_advanced_users' in ks:
        ks.remove('for_advanced_users')
        ks.append('for_advanced_users')

    for key in ks:
        if key == '0':
            for i in sorted(g[key]):
                indb['indicatorsTree']['children'].append({'id': i})
            indb['indicatorsTree']['children'].append(pro)
            for i in range(len(area)):
                key = 'geo.'+to_concept_id(area[i]['n'])
                indb['indicatorsTree']['children'][-1]['children'].append({'id': key})
            indb['indicatorsTree']['children'][-1]['children'].append({'id': 'geo.world_4region'})
            continue

        od = OrderedDict([['id', key], ['children', []]])
        indb['indicatorsTree']['children'].append(od)

        g2 = c_all3.ix[g[key]].groupby('menu_level_2').groups
        for key2 in sorted(g2.keys()):
            if key2 == '1':
                for i in sorted(g2[key2]):
                    indb['indicatorsTree']['children'][-1]['children'].append({'id': i})
            else:
                od = OrderedDict([['id', key2], ['children', []]])
                indb['indicatorsTree']['children'][-1]['children'].append(od)
                for i in sorted(g2[key2]):
                    indb['indicatorsTree']['children'][-1]['children'][-1]['children'].append({'id': i})

    return indb
