# i18n Manager

Handles translation of content from 'Developer English' to 'Target' language. The i18n Manager wraps [Jed](http://slexaxton.github.io/Jed/) to support translations. It also provides `Jed` with data support.

## Should I use it?
Yes! Every UI string that goes into the visualization must be translatable. Use the translate method explained below.

## Including the module
```javascript
define(['vizabi.manager.i18n'], function(i18nManager) {
    // Gets an instance of the i18nManager
    var i18n = i18nManager.instance();
});
```

## Methods
```
i18n.instance()
```
Returns an instance of the i18n Manager for usage. The instance can be seen as a 'child' of the i18nManager, and it was designed to be used in a per-visualization basis. When each visualization has its own instance of the i18nManager, it is possible to have multiple visualizations with multiple languages loaded at the same time on the same view.

***

```javascript
i18n.translate(context, singular[, plural, args...])
```
```context``` The context of the _sprintf formatted string_  
```singular``` The _sprintf formatted string_ in singular form  
```plural``` The plural form (if needed) of such string  
```args``` Arguments for determining the plural form 

***

```
i18n.setLanguage(languageCode[, callback])
```
```languageCode``` The code of the language to be loaded  
```callback``` Callback to be executed when the language data is loaded

***

```
i18n.setPath(path)
```
`path` is an _array of objects_ that contains the path to the translation file. It consists of the following properties:  
* `url` URL for the translation file. It should either be the full path to the file or a string in _sprintf format_ for multiple languages/filenames support. In the latter case, it accepts the variables `%(lang)s` and `%(filename)`  
* `id` An ID for the path  
* `desc` A description for the path  

Only `url` is needed. The other two properties are decorative properties that are used for spilling out more information about the precedence of translation files.  

If `path` has multiple elements, they are each visited in order when making the request for the translation files.

## Usage
The snippet below shows how the the i18n Manager is used.

```javascript

```

## Translation files
Files used by the `i18n Manager` for translation are outputs of `po2json`. There are several implementations, and we currently recommend [this one](http://jsgettext.berlios.de/doc/html/po2json.html) written by Joshua I. Miller.

## A _.po_ file
```po
# Portuguese translations for PACKAGE package
# Traduções em português brasileiro para o pacote PACKAGE.
# Copyright (C) 2014 THE PACKAGE'S COPYRIGHT HOLDER
# This file is distributed under the same license as the PACKAGE package.
# Author <author@author.net>, 2014.
#
msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\n"
"Report-Msgid-Bugs-To: \n"
"POT-Creation-Date: 2014-03-05 20:38+0100\n"
"PO-Revision-Date: 2014-04-22 07:57+0200\n"
"Last-Translator: Author <author@author.net>\n"
"Language-Team: Brazilian Portuguese\n"
"Language: pt_BR\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Plural-Forms: nplurals=2; plural=(n > 1);\n"

# The context for chain here is 'metal' (eg. a metal chain)
msgctxt "metal"
msgid "Chain"
msgstr "Corrente"

# The context for chain here is 'restaurant' (eg. the restaurant chain)
msgctxt "restaurant"
msgid "Chain"
msgstr "Cadeia"
```

## Example of a _po2json_ output
```json
{
   "pt_BR" : {
      "" : {
         "Plural-Forms" : " nplurals=2; plural=(n > 1);",
         "MIME-Version" : " 1.0",
         "POT-Creation-Date" : " 2014-03-05 20:38+0100",
         "Language" : " pt_BR",
         "Last-Translator" : "Author <author@author.net>",
         "Content-Type" : " text/plain; charset=UTF-8",
         "PO-Revision-Date" : " 2014-04-22 07:57+0200",
         "Language-Team" : " Brazilian Portuguese",
         "Report-Msgid-Bugs-To" : " ",
         "Project-Id-Version" : " PACKAGE VERSION",
         "Content-Transfer-Encoding" : " 8bit"
      },
      "metal\u0004Chain" : [
         null,
         "Corrente"
      ],
      "restaurant\u0004Chain" : [
         null,
         "Cadeia"
      ]
   }
}
```

Note that the main property of this JSON output is 'pt_BR', which is the language code. This is the property that the i18nManager looks for when translating data to a new language.

## What to do with a _po2json_ output?
Let's say you have a translation file (po2json output) and you want to use that particular file with the i18n Manager.

```javascript
translation-file: http://example.com/translation.json
```  

Using the po2json output from above, we have:
```javascript
define(['vizabi.manager.i18n'], function(i18nManager) {
  var translationURL = 'http://example.com/translation.json';
  // Loads an i18n instance
  var i18n = i18nManager.instance();
  // Sets the translation file path
  i18n.setPath({ url: translationURL });
  // Outputs 'Chain'
  console.log(i18n.translate('metal', 'Chain'));
  // Now load Brazilian Portuguese ('pt_BR')
  i18n.setLanguage('pt_BR', function(lang) {
    // outputs 'Corrente'
    console.log(i18n.translate('metal', 'Chain')); 
  });
});
```