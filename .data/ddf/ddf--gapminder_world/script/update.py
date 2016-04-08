# -*- coding: utf-8 -*-

import requests
import os
from io import BytesIO

# github token. change to your token please.
# token = 'token d6315f80892d004602d1f9fb234f3a399f05b5af'
token = ''

# files:
files = {}

# dont-panic-poverty.csv
org = 'Gapminder'
repo = 'vizabi'
path = '.data/waffles/dont-panic-poverty.csv'
branch = 'develop'
files['dont_panic_poverty'] = {'org': org, 'repo': repo,
                               'branch': branch, 'path': path}

# country entities from systema_globalis
branch = 'newdefinition'
org = 'open-numbers'
repo = 'ddf--gapminder--systema_globalis'
path = 'ddf--entities--geo--country.csv'
files['geo_country'] = {'org': org, 'repo': repo,
                        'branch': branch, 'path': path}

# country_synonyms.xlsx from waffle-server
org = 'Gapminder'
repo = 'waffle-server-importers-exporters'
path = 'data/synonym/country_synonyms.xlsx'
branch = 'world-legacy-with-data'
files['country_synonyms'] = {'org': org, 'repo': repo,
                             'branch': branch, 'path': path}

# area_categorizarion.json from waffle-server
org = 'Gapminder'
repo = 'waffle-server-importers-exporters'
path = 'data/out/gw/meta/area_categorizarion.json'
branch = 'world-legacy-with-data'
files['area_categorizarion'] = {'org': org, 'repo': repo,
                                'branch': branch, 'path': path}

# world_4region entities from systema_globalis
branch = 'newdefinition'
org = 'open-numbers'
repo = 'ddf--gapminder--systema_globalis'
path = 'ddf--entities--geo--world_4region.csv'
files['world_4region'] = {'org': org, 'repo': repo,
                          'branch': branch, 'path': path}

# global entities from systema_globalis
branch = 'newdefinition'
org = 'open-numbers'
repo = 'ddf--gapminder--systema_globalis'
path = 'ddf--entities--geo--global.csv'
files['global'] = {'org': org, 'repo': repo,
		   'branch': branch, 'path': path}

# quantities.json from waffle-server
org = 'Gapminder'
repo = 'waffle-server-importers-exporters'
path = 'data/out/gw/meta/quantities.json'
branch = 'world-legacy-with-data'
files['quantities'] = {'org': org, 'repo': repo,
                       'branch': branch, 'path': path}

# metadata.json from vizabi
org = 'Gapminder'
repo = 'vizabi'
path = '.data/waffles/metadata.json'
branch = 'develop'
files['metadata'] = {'org': org, 'repo': repo,
                     'branch': branch, 'path': path}

# en.json from vizabi
org = 'Gapminder'
repo = 'vizabi'
path = '.data/translation/en.json'
branch = 'develop'
files['en'] = {'org': org, 'repo': repo,
               'branch': branch, 'path': path}

# The graph settings file
graph = {'url': 'https://docs.google.com/spreadsheets/d/192pjt2vtwAQzi154LJ3Eb5RF8W9Fx3ZAiUZy-zXgyJo/export?format=csv&id=192pjt2vtwAQzi154LJ3Eb5RF8W9Fx3ZAiUZy-zXgyJo&gid=3',
         'fname': 'graph_settings - Indicators.csv'}


def getGoogleDoc(url, outfile):
    r = requests.get(url)

    with open(outfile, 'wb') as f:
        obj = BytesIO(r.content)
        f.write(obj.read())
        f.close()
    return


def getFileName(path):
    if '/' in path:
        return path.split('/')[-1]
    else:
        return path

def getDirPath(path):
    if '/' in path:
        return '/'.join(path.split('/')[:-1])
    else:
        return ''


def getGithubFile(org, repo, branch, path, token, outfile):
    dir = getDirPath(path)
    fn = getFileName(path)
    if dir:
        u1 = "https://api.github.com/repos/{org}/{repo}/contents/{dir}".format(**{'org': org, 'repo': repo, 'dir': dir})
    else:
        u1 = "https://api.github.com/repos/{org}/{repo}/contents".format(**{'org': org, 'repo': repo})
    r = requests.get(u1, headers={'Authorization': token}, params={'ref': branch})

    for i in r.json():
        if i['name'] == fn:
            # print(i['sha'])
            sha = i['sha']
    try:
        blob_url = 'https://api.github.com/repos/{org}/{repo}/git/blobs/{sha}'.format(org=org, repo=repo, sha=sha)
    except UnboundLocalError:
        for i in r.json():
            print(i['name'])
        raise

    r2 = requests.get(blob_url, headers={'Authorization': token, 'Accept': 'application/vnd.github.v3.raw'})
    cont = BytesIO(r2.content)

    with open(outfile, 'wb') as f:
        f.write(cont.read())
        f.close()

    return


if __name__ == '__main__':
    outpath = '../source/'
    for v in files.values():
        fn = getFileName(v['path'])
        outfile = os.path.join(outpath, fn)
        print(fn)
        getGithubFile(v['org'], v['repo'], v['branch'], v['path'], token, outfile)

    outfile2 = os.path.join(outpath, graph['fname'])
    print(graph['fname'])
    getGoogleDoc(graph['url'], outfile2)
    print('Done.')
