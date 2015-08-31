#Readers for Big-Data installations.

##Apache [Drill](https://github.com/apache/drill) reader
Reads from Drill's [REST API](https://docs.google.com/document/d/1mRsuWk4Dpt6ts-jQ6ke3bB30PIwanRiCPfGxRwZEQME/).
###Installation
Follow the [Drill in 10 minutes](http://drill.apache.org/docs/drill-in-10-minutes/) tutorial to setup a local server.
###Setup
Create a storage plugin called "vzb" pointing to your local data (see details in the Drill tutorial):
{
  ...
  "workspaces": {
    ...
    "dev": {
      "location": "/path/to/your/workspace/vizabi/local_data",
      "writable": true,
      "defaultInputFormat": null
    }
  },
  "formats": {
    ...
    "csv": {
      "type": "text",
      "extensions": [
        "csv"
      ],
      "skipFirstLine": true,
      "delimiter": ","
    },
    ...
  }
}

From the shell, copy the basic-indicators.csv data into a Parquet table (see details in the Drill tutorial):

ALTER SESSION SET `store.format`='parquet';

CREATE TABLE vzb.dev.`/bigdata/parquet_basic_indicators` AS
SELECT
CAST(columns[0] AS INT)  `time`,
columns[1] as `geo`,
CASE 
    WHEN columns[2] = '' THEN NULL 
    ELSE CAST(columns[2] AS DOUBLE) 
END as `gdp_per_cap`,
CASE 
    WHEN columns[3] = '' THEN NULL 
    ELSE CAST(columns[3] AS DOUBLE) 
END as `lex`,
CASE 
    WHEN columns[4] = '' THEN NULL 
    ELSE CAST(columns[4] AS BIGINT) 
END as `pop`,
columns[5] as `geo_name`,
columns[6] as `geo_cat`,
CASE 
    WHEN CHAR_LENGTH(columns[7]) < 2 THEN '' 
    ELSE columns[7] 
END as `geo_region`
FROM vzb.dev.`/waffles/en/basic-indicators.csv`;

###Test
Call Vizabi using:
Vizabi('BubbleChart', placeholder, {
	data: { reader: 'drill-rest', 
			dbpath: 'http://localhost:8047/query.json',
			sql_query: 'select `time`, `geo`, `gdp_per_cap`, `lex`, `pop`, `geo_name` as `geo.name`, `geo_cat` as `geo.cat`, `geo_region` as `geo.region` from  vzb.dev.`/bigdata/parquet_basic_indicators`'}
});


