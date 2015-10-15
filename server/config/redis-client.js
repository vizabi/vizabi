var redis = require('redis');
var host = 'localhost';
var port = 6379;

var dockerConn = getDockerRedisConnection();
if (dockerConn) {
  host = dockerConn.host;
  port = dockerConn.port;
}

module.exports = process.env.REDIS_URL ?
  redis.createClient(process.env.REDIS_URL) :
  redis.createClient(port, host, {});

function getDockerRedisConnection() {
  var r = /redis_port_(\d+)_tcp_addr/ig;
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
    return {
      port: port,
      host: host
    }
  } catch (e) {
    return false;
  }
}
