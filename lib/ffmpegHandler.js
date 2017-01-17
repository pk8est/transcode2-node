var fs = require('fs');
var path = require('path');
var events = require('events');
var lineReader = require('line-reader');
var _spawn = require('child_process').spawn;
var util = require('./util');
var config = require('../conf/config');

function ffmpegHandler() {
    var that = new events.EventEmitter()
    that.source = null;

    that.createM3u8ListFile = function(output, m3u8List, callback){
        try{
            var lines = [];
            lines.push("#EXTM3U");
            for(i in m3u8List){
                var m3u8 = m3u8List[i]
                lines.push(`#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=${m3u8.bandwidth},RESOLUTION=${m3u8.resolution}`);
                lines.push(m3u8.filename);
            }
            fs.writeFileSync(output, lines.join("\n"))
            return true;
        }catch(e){
            return false;
        }
    }

    that.createM3u8File = function(input, output, rate, callback){
        var lines = [];
        try{
            lineReader.eachLine(input, function(line, last) {
                if(line.indexOf("#") != 0 && line.trim("")){
                    line = line + "?rate=" + rate;
                }
                line = lines.push(line)
                if(last){
                    fs.writeFile(output, lines.join("\n"), function(err){
                        if(err) callback(err)
                        else callback(null, output);
                    })
                }
            })
        }catch(e){
            callback(e);
        }
    }

    that.createM3u8FileByContent = function(data, output, rate, callback){
        var lines = [];
        try{
           var list = data.split("\n")
           for(i in list){
                var line = list[i];
                if(line.indexOf("#") != 0 && line.trim("")){
                    line = line + "?rate=" + rate;
                }
                line = lines.push(line)
           }
            fs.writeFile(output, lines.join("\n"), function(err){
                if(err) callback(err)
                else callback(null, output);
            })
        }catch(e){
            callback(e);
        }
    }

    that.encodeRemoteFile = function(file, rateParams, callback){
        try{
            var args = [
                "-loglevel",
                "error",
                "-nostats",
                "-i",
                file,
                "-copyts",
                "-vcodec",
                util.getValue(rateParams, "encodeParams.-vcodec", "libx264"),
                "-b:v",
                util.getValue(rateParams, "encodeParams.-b:v", "1000k"),
                "-acodec",
                util.getValue(rateParams, "encodeParams.-acodec", "copy"),
                "-b:a",
                util.getValue(rateParams, "encodeParams.-b:a", "64k"),
                "-ar",
                util.getValue(rateParams, "encodeParams.-ar", "44100"),
                "-profile:v",
                util.getValue(rateParams, "encodeParams.-profile:v", "high"),
                "-vf",
                util.getValue(rateParams, "encodeParams.-vf", "scale=-2:720"),
                "-threads",
                util.getValue(rateParams, "encodeParams.-threads", "1"),
                "-f",
                util.getValue(rateParams, "encodeParams.-f", "mpegts"),
                "-subq",    
                "5",
                "-trellis",
                "1",
                "-refs",
                "1",
                "-coder",
                "0",
                "-me_range",
                "16",
                "-keyint_min",
                "25",
                "-sc_threshold",
                "40",
                "-i_qfactor",
                "0.71",
            ]
            var extraParams = util.getValue(rateParams, "extraParams", []);
            for (i in extraParams) {
                args.push(extraParams[i]);
            };
            args.push("pipe:1")
            var handler = _spawn("ffmpeg", args, {});

            handler.stderr.on('data', function (data) {
                callback("[COMMAND]" + "ffmpeg " + args.join(" ") + ";[ERROR]" +  data.toString(), null)
            });

            callback(null, handler.stdout)
        }catch(e){
            callback(e)
        }
    }

    return that;
}

function spawn(command, args, options, processCB, endCB){
    if (typeof options === 'function') {
      endCB = processCB;
      processCB = options;
      options = {};
    }

    if (typeof endCB === 'undefined') {
      endCB = processCB;
      processCB = function() {};
    }
    util.logger("Command: " + command + " " + args.join(" "))
    var handler = _spawn(command, args, options);

    handler.stdout.on('data', function (data) {
        processCB(data.toString())
    });

    handler.stderr.on('data', function (data) {
        processCB(data.toString())
    });

    handler.on('error', function(err) {
        endCB(err, null);
    });
    
    handler.on('close', function (code) {
        endCB(null, code)
    });

}

module.exports = ffmpegHandler();
