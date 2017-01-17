const minimist = require('minimist')

var argv = minimist(process.argv.slice(2), {
    alias: {port: 'p', env: "e"},
    "default": {
        port: 80,
        env: "production",
    }
});

global.__ENV__ = argv.env;

const config = require("./conf/config")
const app = require("./lib/app")
const util = require('./lib/util');

util.mkdirsSync(config.M3U8_PATH)
app.run(argv.port, function(server){
    var ip = server.address().address;
    if(ip == "::") ip = "localhost";
    util.logger('cdn server running on port ' + server.address().port)
    util.logger('http://' + ip + ':' + server.address().port)
})