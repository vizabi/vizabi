//div is resizable
var placeholder = document.getElementById('vzbp-placeholder');
var container = document.getElementById('vzbp-main');
var editorTextArea = document.getElementById("vzbp-state-editor-textarea");
var viz;

/*
 * Share Section
 */

document.getElementById("vzbp-btn-refresh").onclick = resetURL;
document.getElementById("vzbp-btn-github").onclick = viewOnGithub;
document.getElementById("vzbp-btn-codepen").onclick = updateURL;
document.getElementById("vzbp-btn-share").onclick = shareLink;

//share link
function shareLink() {
    updateURL();
    var address = "https://api-ssl.bitly.com/v3/shorten",
        params = {
            access_token: "8765eb3be5b975830e72af4e0949022cb53d9596",
            longUrl: document.URL
        };
    getJSON(address, params, function(response) {
        if (response.status_code == "200") {
            prompt("Copy the following link: ", response.data.url);
        } else {
            prompt("Copy the following link: ", window.location);
        }
    });
}

function viewOnGithub() {
    var url = window.location.pathname;
    var branch;
    var github_base = 'https://github.com/Gapminder/vizabi/tree/';
    var github_tools_prepend = '/src/tools/';
    var prefix = "preview/";
    var tool_path = url.substring(url.indexOf(prefix) + prefix.length, url.indexOf(".html"));

    // TODO: In development, there is no info about the branch in the URL. Can be improved by looking into https://github.com/notatestuser/gift
    if (url.indexOf('dist') >= 0 || url.indexOf('develop') >= 0) {
        branch = 'develop';
    }
    else {
        branch = url.substring(url.indexOf('feature'), url.indexOf('/preview'));
    }
    window.open(github_base + branch + github_tools_prepend + tool_path, '_blank');
}