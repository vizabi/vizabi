# -*- coding: utf-8 -*-

import numpy as np
import re


def to_concept_id(s, sub='[/ -\.\*";]+', sep='_'):
    '''convert a string to lowercase alphanumeric + underscore id for concepts'''
    if s is np.nan:
        return s

    s1 = re.sub(sub, sep, s.strip())
#     s1 = re.sub(r'\[.*\]', '', s1)
    s1 = s1.replace('\n', '')

    if s1[-1] == sep:  # remove the last underscore
        s1 = s1[:-1]

    return s1.lower()


def to_dict_dropna(data):
    return dict((k, v.dropna().to_dict()) for k, v in data.iterrows())
