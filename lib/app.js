var http = require('http');
var route = require('./route');
var router = require('./router');
var util = require('./util');

var server = http.createServer(function(req, res){
    try{
        util.logger(req.url)
        router.runAction(req, res);
    }catch(e){
        util.error(e)
    }
})

module.exports.run = function(port, callback){
    if(!callback) callback = function(){}
    server.listen(port, ()=>{callback(server)})
}
