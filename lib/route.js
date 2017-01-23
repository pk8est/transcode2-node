var path = require('path')
var fs = require('fs')
var fetch = require('node-fetch')
var request = require('request')
var util = require("./util");
var route = require("./router");
var config = require("../conf/config");
var ffmpegHandler = require("./ffmpegHandler");

route.get("/(.*)-playlist\.m3u8", function(req, res, params){
    var filePath = req.reg[1];
    var localFile = getLocalM3u8Addr(filePath, 'playlist');

    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/x-mpegURL');

    if(fs.existsSync(localFile)){
        res.setHeader('Content-Length', util.getFileLength(localFile))
        return fs.createReadStream(localFile).pipe(res);
    }

    fetch(getRemoteFileAddr(filePath)).then(response => { 
        if(!response.ok) return false
        return response.text()
    }).then((body) => { 
        if(!body) return notFount(res)
        generaterPlaylist(filePath, body, req, function(err, indexFile, listFile){
            res.setHeader('Content-Length', util.getFileLength(localFile))
            fs.createReadStream(localFile).pipe(res);
        })
    })

})

route.get("/(.*)\.m3u8.json", function(req, res, params){

    var filePath = req.reg[1];

    fetch(getRemoteFileAddr(filePath)).then(response => { 
        if(!response.ok) return res.jsonOutput({code:-1, message: "404"})
        return response.text()
    }).then((body) => {
        if(!body) return res.jsonOutput({code:-1, message: "404"})
        generaterPlaylist(filePath, body, req, function(err, indexFile, listFile){
            res.jsonOutput({code:1, index: indexFile, list: listFile})
        }) 
    })

})


route.get("/(.*)\.m3u8", function(req, res, params){

    var filePath = req.reg[1];
    var rate = params.get("rate", "720p");
    var rateParams = config.getRateParam(rate);
    var localFile = getLocalM3u8Addr(filePath, rate);
    if(!rateParams) return notFount(res)

    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/x-mpegURL');


    if(fs.existsSync(localFile)){
        res.setHeader('Content-Length', util.getFileLength(localFile))
        return fs.createReadStream(localFile).pipe(res);
    }


    var remoteFile = getRemoteFileAddr(filePath);

    fetch(remoteFile).then(response => {
        if(!response.ok) return false
        return response.text()
    }).then((body) => {
        if(!body) return notFount(res)
        try{
            ffmpegHandler.createM3u8FileByContent(body, localFile, rate, function(err){
                if(err){
                    util.error(err)
                    return getContentByRemote(res, remoteFile)
                }else{
                    res.setHeader('Content-Length', util.getFileLength(localFile))
                    fs.createReadStream(localFile).pipe(res);
                }
            })
        }catch(e){
            util.error(e)
            return getContentByRemote(res, remoteFile)
        }
    })

});

route.get("/(.*)\.ts", function(req, res, params){
    var filePath = req.reg[1];
    var rate = params.get("rate", null);
    var remoteFile = config.REMOTE_TS_PATH + filePath + ".ts"
    var localFile = getLocalTsAddr(filePath, rate);
    var localTempFile = getLocalTempTsAddr(filePath, rate);

    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Connection', 'keep-alive');

    if(fs.existsSync(localFile) && !params.get("force")){
        return fs.createReadStream(localFile).pipe(res);
    }

    fetch(remoteFile, {method:"HEAD"}).then(response => { 
        if(!response.ok) return false
        return true
    }).then((flag) => { 
        if(!flag) return notFount(res)

        var rateParams = config.getRateParam(rate);
        if(!rateParams || util.getValue(rateParams, "copy", false)){
            return getContentByRemote(res, remoteFile)
        }else{
            try{
                ffmpegHandler.encodeRemoteFile(remoteFile, rateParams, function(err, stream){
                    if(err){
                        util.error("[FILE]"+remoteFile+";"+err)
                        res.end();
                    }else{
                        stream.pipe(fs.createWriteStream(localTempFile));
                        stream.on("data", function(chunk){
                            res.write(chunk);
                        })
                        stream.on("end", function(){
                            res.end();
                            fs.rename(localTempFile, localFile, function(err2){
                                if(err2) util.error(err2)
                            })
                        })
                    }
                })
            }catch(e){
                util.error(e)
                res.end();
            }
        }
    })
});

route.get("/ping", function(req, res, params){
    res.jsonOutput({code:1})
})

function getRemoteFileAddr(filePath){
    return config.REMOTE_M3U8_PATH + filePath + ".m3u8";
}

function getLocalM3u8Addr(filePath, rate){
    return path.join(config.M3U8_PATH, util.md5(filePath) + "-" + rate + ".m3u8"); 
}

function getLocalTsAddr(filePath, rate){
    return path.join(config.TS_PATH, util.md5(filePath) + "-" + rate + ".ts"); 
}

function getLocalTempTsAddr(filePath, rate){
    return path.join(config.TS_TEMP_PATH, util.md5(filePath) + "-" + rate + "-temp-" + new Date().getTime().toString() + Math.random().toString() + ".ts"); 
}

function getContentByRemote(res, remoteFile){ 
    return request(remoteFile).pipe(res)
}

function notFount(res){
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end();
}

function generaterPlaylist(filePath, body, req, callback){
    var filePathMd5 = util.md5(filePath);
    var indexFile = path.join(config.M3U8_PATH, filePathMd5 + "-playlist.m3u8"); 
    var rawFile = config.REMOTE_M3U8_PATH + filePath + ".m3u8";
    var host = util.getValue(config, "M3U8_HOST", "http://" + req.headers.host) + "/"

    var encodes = util.getValue(config, "ENCODE.definitions", [])
    var outputs = {}
    var m3u8EncdoeList = [];
    for(rate in encodes){
        var definitionConf = encodes[rate];
        var output = path.join(config.M3U8_PATH, filePathMd5 + "-" + rate + ".m3u8");
        outputs[rate] = host + filePath + ".m3u8?rate=" + rate;
        m3u8EncdoeList.push({
            rate: rate,
            filename: path.basename(rawFile) + "?rate=" + rate,
            bandwidth: util.getValue(definitionConf, "bandwidth"),
            resolution: util.getValue(definitionConf, "resolution",  "1920x1080"),
        })
        ffmpegHandler.createM3u8FileByContent(body, output, rate, function(err){
            if(err) util.error(err)
        })
    }
    var index = host + filePath + "-playlist.m3u8";
    ffmpegHandler.createM3u8ListFile(indexFile, m3u8EncdoeList);
    callback(null, index, outputs)
}