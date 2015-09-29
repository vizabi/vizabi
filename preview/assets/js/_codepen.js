//view example on codepen

function viewOnCodepen(TITLE, TOOL, BRANCH, STATE) {

  var BASE_URL = (BRANCH.indexOf("localhost") === -1) ? BRANCH : "http://static.gapminderdev.org/vizabi/develop/dist/";

  var data = {
    title: "VIZABI EXAMPLE - " + TITLE,
    html: "<h1>Vizabi Example: " + TITLE + "</h1><div id='placeholder'></div>",
    css: "body{font-family:Arial,sans-serif;text-align:center;background:#f2f2f2}h1{color:#ccc}#placeholder{position:relative;display:block;margin:0 auto;width:600px;height:400px;border:1px solid #ccc}",
    js: "var viz = Vizabi('" + TOOL + "', document.getElementById('placeholder'), { state: " + STATE +
      ", data: { reader: 'csv-file', path: 'https://dl.dropboxusercontent.com/u/4933279/csv/basic-indicators.csv' }});",
    js_external: "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.js;" + BASE_URL + "vizabi.min.js",
    css_external: BASE_URL + "vizabi.css"
  };

  var JSONstring = JSON.stringify(data).replace(/"/g, "&​quot;").replace(/'/g, "&apos;");

  var form = document.createElement('FORM');
  form.name = 'CodepenForm';
  form.id = 'CodepenForm';
  form.method = 'POST';
  form.action = 'http://codepen.io/pen/define';
  form.target = '_blank';

  field = document.createElement('INPUT');
  field.type = 'HIDDEN';
  field.name = 'data';
  field.value = JSONstring;
  form.appendChild(field);
  document.body.appendChild(form);
  form.submit();
  document.getElementById("CodepenForm").remove();

}