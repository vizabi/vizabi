var defaultUrl = 'mongodb://localhost:27017/gapminder-tools';
var envUrl = process.env.MONGO_URL;
var dockerUrl = getDockerMongoUrl();
module.exports = {
  // the database url to connect
  url: envUrl || dockerUrl || defaultUrl
};

function getDockerMongoUrl() {
  var r = /mongo_port_(\d+)_tcp_addr/ig;
  var keys = Object.keys(process.env)
    .filter(function (key) {
      return r.test(key);
    });

  if (!keys || keys.length === 0) {
    return false;
  }

  try {
    var port = r.exec(keys[0])[1];
    var host = process.env[keys[0]];
    return 'mongodb://' + host + ':' + port +'/gapminder-tools'
  } catch (e) {
    return false;
  }
}
