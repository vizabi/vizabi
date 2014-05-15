# Data Manager

The Data Manager provides an abstraction for communication with an external Gapminder API that supplies data to our visualizations. This abstraction contains several methods to facilitate the retrieval of specific parts of our dataset.

## Should I use it?
Yes! Use it to get data when developing the visualizations. This should be the only endpoint for Gapminder data during development. Also, keep the original data intact in the Data Manager, even if you have access to Data Manager's cache.

## Including the module
```javascript
define(['data-manager'], function(dataManager) {
    // eg. loading indicator 'pop' in English
    dataManager.getIndicator('pop', 'en');
});
```

## Methods
### Retrieving Indicators
```javascript
getIndicator(indicator, lang[, callback])
```
`indicator` The indicator to retrieved.  
`lang` The language that you want to receive the indicator in.  
`callback` Optional callback function.

`response` A JSON object containing the requested indicator data. If the request fails, a JSON object with the properties `status` and `msg` is returned, where ```status = 404```.

##### Working request
```javascript
getIndicator('pop', 'pt', function(json) {
    console.log(json);
});
```

##### Response
```json
{
  "id": "pop",
  "name": "População",
  "short_name": "Population",
  "description": "Total population",
  "unit": "num_people",
  "type": "numeric"
}
```

##### Erroneous request
```javascript
getIndicator('xyz', 'en', function(json) {
    console.log(json);
});
```

##### Response
```json
{
  "status": 404,
  "msg": "Indicator xyz not found"
}
```

***

### Retrieving Categories
```javascript
getCategory(category, lang[, callback])
```
`category`: The category to be retrieved.  
`lang`: The language that you want to receive the indicator in.  
`callback`: Optional callback function.

`response`: A JSON object containing the requested category data. If the request fails, a JSON object with the properties `status` and `msg` is returned, where ```status = 404```.

##### Working request
```javascript
getCategory('planet', 'pt', function(json) {
    console.log(json);
});
```

##### Response
```json
{
  "id": "planet",
  "list_name": "World",
  "property_name": "world",
  "possessive": "World",
  "expanded_choice_format": {
    "unknown": "world",
    "none": "world",
    "singular": "world",
    "plural": "worlds"
  },
  "description": "The World",
  "dimension": "geo",
  "sums": false,
  "parent": "",
  "count": 1,
  "schema": {},
  "things": [
    {
      "id": "world",
      "name": "Mundo",
      "lat": 0,
      "long": 0
    }
  ]
}
```

##### Erroneous request
```javascript
getCategory('www', 'en', function(json) {
    console.log(json);
});
```

##### Response
```json
{
  "status": 404,
  "msg": "Category www not found"
}
```

***

### Retrieving 'things'
```javascript
getCategoryThings(category, lang[, callback])
```
`category`: The category to retrieve 'things' of.  
`lang`: The language that you want to receive the things in.  
`callback`: Optional callback function.

`response`: A JSON array containing the requested category 'things' data. If the request fails, a JSON object with the properties `status` and `msg` is returned, where ```status = 404```.

##### Working request
```javascript
getCategoryThings('unstate', 'en', function(json) {
    console.log(json);
});
```

##### Response
```json
[
  {
    "id": "alb",
    "name": "آلبانی",
    "short_name": null
  },
  {
    "id": "and",
    "name": "آندورا",
    "short_name": null
  },
  {
    "id": "arm",
    "name": "ارمنستان",
    "short_name": null
  },
  ...
]
```

##### Erroneous request
```javascript
getCategoryThings('xyz', 'en', function(json) {
    console.log(json);
});
```

##### Response
```json
{
  "status": 404,
  "msg": "Category xyz not found"
}
```

***

### Retrieving 'stats'
```javascript
getStats(indicator[, callback])
```
`indicator` The indicator for which you want data for. (eg. 'pop', 'lex')

`response` A JSON object containing the requested data. This object is passed as an argument to the callback function. If an invalid request is made, a JSON object with the properties `status` and `msg` is returned, where ```status = 404```.

##### Working request
```javascript
dataManager.getStats('pop', function(json) {
    console.log(json);
});
```

##### Response
```json
{
    "dma": {
        "1800": {
            "v": "19950",
            "n": []
        },
        "1801": {
            "v": "19950",
            "n": []
        },
        "1802": {
            "v": "19950",
            "n": []
        },
        ...
    }
}
```

##### Erroneous request
```javascript
getStats('xyz', function(json) {
    console.log(json);
});
```

##### Response
```json
{
  "status": 404,
  "msg": "Indicator xyz not found!"
}
```

***

### Retrieving the data object
Everything you request gets saved to the cache. To get the full data (eg. after all requests are completed), you can just retrieve the cache object.

```javascript
getCache()
```
Returns a reference to the Data Manager's cache object. Use this to access data throughout your application. This object has a defined set of properties that gets filled with calls to the Data Manager.

##### Example
```javascript
var cache = dataManager.getCache();
```

```json
{
    "definitions": {
        "indicators": [
            {
                "id": "pop",
                "name": "População",
                "short_name": "Population",
                "description": "Total population",
                "unit": "num_people",
                "type": "numeric"
            },
            {
                "id": "lex",
                "name": "Expectativa de vida",
                "short_name": "Lifespan",
                "unit": "years_age",
                "type": "numeric",
                "tags": [
                    "health"
                ]
            }
        ],
        "categories": [
            {
                "id": "unstate",
                "list_name": "Estados ONU",
                "property_name": "Estados ONU",
                "possessive": "estado reconhecido pela ONU na {parent}",
                "expanded_choice_format": {
                    "unknown": "estados reconhecidos pela ONU",
                    "none": "estado reconhecido pelo ONU",
                    "singular": "estado reconhecido pela ONU",
                    "plural": "estados reconhecidos pela ONU"
                },
                "description": "Estados reconhecidos pela ONU",
                "link": "http://www.un.org/en/members/",
                "dimension": "geo",
                "sums": true,
                "parent": "region",
                "count": 195,
                "schema": {},
                "things": [
                    {
                        "id": "alb",
                        "name": "Albânia",
                        "region": "eur",
                        "types": "un_state",
                        "lat": "41",
                        "long": "20",
                        "un": "member",
                        "short_name": null
                    },
                    {
                        "id": "and",
                        "name": "Andorra",
                        "region": "eur",
                        "types": "un_state",
                        "lat": "42.5",
                        "long": "1.5",
                        "un": "member",
                        "short_name": null
                    },
                    ...
                ]
            }
        ]
    },
    "stats": {
        "pop": {
              "alb": {
                "1600": {
                    "v": "200000",
                    "n": []
                },
                "1601": {
                    "v": "200813",
                    "n": []
                },
                "1602": {
                    "v": "201628",
                    "n": []
                },
                ...
            },
            ...
        },
        "lex": {
            "alb": {
                "1800": {
                    "v": 35.4,
                    "n": []
                },
                "1801": {
                    "v": 35.4,
                    "n": []
                },
                "1802": {
                    "v": 35.4,
                    "n": []
                },
                ...
            },
            ...
        }
    }
};
```  
  
The cache above is obtained after doing the following requests:
```javascript
dataManager.getIndicator('pop', 'pt');
dataManager.getIndicator('lex', 'pt');
dataManager.getCategory('unstate', 'pt');
dataManager.getStats('pop');
dataManager.getStats('lex');
```
