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
curl -s -H "Content-Type: application/json" -d '{"query":[{"SELECT":["geo","geo.name","time","geo.region", "geo.category","lex","gdp_per_cap","pop"],"WHERE":{"geo":["*"],"geo.category":["*"],"time":["1990-2014"]}}],"language":"'$i'"}'  http://waffle-server-1.herokuapp.com/api/query > examples/$i/response_0.json

curl -s -H "Content-Type: application/json" -d '{"query":[{"SELECT":["geo","geo.name", "geo.region", "geo.category"],"WHERE":{"geo":["*"],"geo.category":["*"]}}],"language":"'$i'"}'  http://waffle-server-1.herokuapp.com/api/query > examples/$i/response_1.json
echo "SAVED!"
done

echo "Finished."