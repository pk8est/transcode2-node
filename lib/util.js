var fs = require("fs")
var path = require("path")
var crypto = require('crypto');
var moment = require('moment');
var logger = require('./log');

module.exports.logger = function(log){
    if(log) logger.debug.debug(log)
}

module.exports.error = function(error){
    if(error) logger.error.error(error)
}

module.exports.getId = function(link){
    return module.exports.md5(link);
}

module.exports.md5 = function(content){
    var md5 = crypto.createHash('md5');
    md5.update(content);
    return md5.digest('hex');  
}

module.exports.getRange = function(contentRange){
    try{
        var range = contentRange.split("=")[1].split("-")
        return {start: parseInt(range[0]), end: parseInt(range[1])}
    }catch(e){
        return {}
    }
}

module.exports.getLength = function(content){
    if(content.hasOwnProperty("content-range")){
        return parseInt(content["content-range"].split("/")[1])
    }else if(content.hasOwnProperty("content-length")){
        return parseInt(content["content-length"])
    }
    return 0
}

module.exports.isVideo = function(type){
    return type && (type.indexOf("video")!=-1 || type.indexOf("Flash")!=-1) ? true : false;
}

module.exports.unlink = function(link){
    fs.exists(link, function (exists) {
        if(exists) fs.unlink(link)
    })
}

module.exports.stat = function(link, cb){
    if(!cb) cb = function(){}
    fs.exists(link, function (exists) {
        var file = {}
        if(exists){
            fs.stat(link, function (err, st) {
                if (err) return cb(err)
                file.length = st.size
                file.name = path.basename(link)
                file.path = link;
                file.createReadStream = function (opts) {
                    return fs.createReadStream(link, opts)
                }
                cb(file)
            })
        }else{
            cb(null)
        }
    })
}

module.exports.getMateDataSize = function(data){
    var BOX_TYPE_MOOV = 0x6D6F6F76;
    var length = 4;
    for (var i = 0; i <= 10; i++) {
        var start = i * length * 2
        var sizeBuf = new Buffer(data.slice(start, start+length))
        var size = sizeBuf.readUInt32BE(0)
        start += length;
        var typeBuf = new Buffer(data.slice(start, start+length))
        var type = typeBuf.readUInt32BE(0)
        if(type == BOX_TYPE_MOOV){
            return size;
        }
    };
    return 0
}
module.exports.getHomePath = function(){
    var _path = process.cwd();
    try{_path = require('electron').app.getPath("userData")}catch(e){}
    return _path;
}

module.exports.mkdirsSync = function(dirname, mode){
    if(fs.existsSync(dirname)){
        return true;
    }else{
        if(module.exports.mkdirsSync(path.dirname(dirname), mode)){
            fs.mkdirSync(dirname, mode);
            return true;
        }
    }
}

module.exports.getFileLength = function(file){
    var states = fs.statSync(file); 
    return states.size; 
}

module.exports.getHomePath = function getHomePath(){
    var path = process.cwd();
    try{path = require('electron').app.getPath("userData")}catch(e){}
    return path;
}

module.exports.getValue = function getValue(obj, key, defaultValue){
    var loop = key.toString().split(".");
    var obj = Object.assign({}, obj);
    try{ 
        for(i in loop){
            if(!obj.hasOwnProperty(loop[i])){
                return defaultValue;
            }
            obj = obj[loop[i]];
        }
    }catch(e){
        return defaultValue;
    }
    return obj;
}


module.exports.getYesterdayTime = function getYesterdayTime(){
    var yesterday = moment(new Date().getTime() - 86400 * 1000).format("YYYY-MM-DD 00:00:00");
    return new Date(yesterday).getTime()
}
