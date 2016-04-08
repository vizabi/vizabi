# -*- coding: utf-8 -*-
"""create ddf--index.csv"""

import csv
from pandas import DataFrame, concat
import os
import re

# global variables
out_dir = '../output'
index_columns = ['key', 'value', 'file']


def concept_index(path, concept_file):

    df = DataFrame([], columns=index_columns)

    with open(os.path.join(path, concept_file)) as f:
        reader = csv.reader(f, delimiter=',', quotechar='"')
        # we only need the headers for index file.
        try:
            header = reader.__next__()  # python3
        except AttributeError:
            header = reader.next()  # python2

    header.remove('concept')
    df['value'] = header
    df['key'] = 'concept'
    df['file'] = concept_file

    return df


def entity_index(path, entity_file):

    df = DataFrame([], columns=index_columns)

    # get the domain/set name from file name.
    # there are 2 possible format for entity filename:
    # 1. ddf--entities--$domain.csv
    # 2. ddf--entities--$domain--$set.csv
    match = re.match('ddf--entities--([\w_]+)-*(.*).csv', entity_file).groups()
    if len(match) == 1:
        domain = match[0]
        concept = None
    else:
        domain, concept = match

    with open(os.path.join(path, entity_file)) as f:
        reader = csv.reader(f, delimiter=',', quotechar='"')
        # we only need the headers for index file
        try:
            header = reader.__next__()  # python3
        except AttributeError:
            header = reader.next()  # python2

    # find out which key is used in the file.
    # the key in index should be consistent with the one in entities
    if domain in header:
        header.remove(domain)
        key = domain
    if concept in header:
        header.remove(concept)
        key = concept

    df['value'] = header
    df['key'] = key
    df['file'] = entity_file

    return df


def datapoint_index(path, datapoint_file):
    df = DataFrame([], columns=index_columns)

    value, key = re.match('ddf--datapoints--([\w_]+)--by--(.*).csv', datapoint_file).groups()

    key = ','.join(key.split('--'))

    df['value'] = value.split('--')
    df['key'] = key
    df['file'] = datapoint_file

    return df


def create_index_file(path, indexfile):
    fs = os.listdir(path)

    res = []
    for f in fs:
        if 'concept' in f:
            res.append(concept_index(path, f))
        if 'entities' in f:
            res.append(entity_index(path, f))
        if 'datapoints' in f:
            res.append(datapoint_index(path, f))

    res_df = concat(res)
    res_df = res_df.drop_duplicates()
    res_df.to_csv(indexfile, index=False)
