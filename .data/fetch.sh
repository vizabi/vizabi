#!/bin/bash
# Fetches data from data kitchen server and populates local files
# This script is a hotfix to update dummy data used in Vizabi from our server
#
# IMPORTANT NOTE:
# This is a hotfix and this file will be removed in upcoming versions


languages=( en fa pt )

for i in "${languages[@]}"
do
echo "Fetching data for language: "$i
curl -s -H "Content-Type: application/json" -d '{"query":[{"SELECT":["geo","geo.name","time","geo.region", "geo.cat","lex","gdp_pc","pop"],"FROM":"humnum","WHERE":{"geo":["*"],"geo.cat":["*"],"time":["1990-2014"]}}],"language":"'$i'"}'  http://waffle.gapminder.org/api/v1/query > waffles/$i/basic-indicators.json

curl -s -H "Content-Type: application/json" -d '{"query":[{"SELECT":["geo","geo.name", "geo.region", "geo.cat"],"FROM":"humnum","WHERE":{"geo":["*"],"geo.cat":["*"]}}],"language":"'$i'"}'  http://waffle.gapminder.org/api/v1/query > waffles/$i/names.json
echo "SAVED!"
done

echo "Finished."