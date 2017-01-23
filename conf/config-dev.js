var config = {}

config.DEFAULT_PORT = 80;
config.LOGDIR = "./log";
config.REMOTE_TS_PATH = 'http://v-livegrab.dwstatic.com/';
config.M3U8_PATH = './m3u8';
config.TS_PATH = './m3u8/ts';
config.TS_TEMP_PATH = './m3u8/ts';
config.REMOTE_M3U8_PATH = 'http://v-livegrab.dwstatic.com/';

config.ENCODE = {
    'segment_time': 30,
    'definitions': {
        '360p': {
            "resolution": "640x360",
            'bandwidth': "1945000",
            'encodeParams':{
                '-f': "mpegts",
                '-vcodec': "libx264",
                '-acodec': "copy",
                '-b:v': "350k",
                '-b:a': "32k",
                '-ar': "44100",
                '-threads': "1",
                '-vf': "scale=-2:360",
                '-profile:v': 'baseline',   //baseline
                '-level': '3.0',   
            },
            'extraParams': [
            ],
        },
        '480p': {
            "resolution": "854x480",
            'bandwidth': "3795000",
            'encodeParams': {
                '-f': "mpegts",
                '-vcodec': "libx264",
                '-acodec': "copy",
                '-b:v': "550k",
                '-b:a': "64k",
                '-ar': "44100",
                '-threads': "1",
                '-vf': "scale=-2:480",
                '-profile:v': 'high', //baseline
                '-level': '4.1',
            },
            'extraParams': [],
        },
        '720p': {
            "resolution": "1280x720",
            'bandwidth': "9600000",
            'encodeParams':{
                '-f': "mpegts",
                '-vcodec': "libx264",
                '-acodec': "copy",
                '-b:v': "1200k",
                '-b:a': "64k",
                '-ar': "44100",
                '-threads': "1",
                '-vf': "scale=-2:720",
                '-profile:v': 'high',   //baseline
                '-level': '4.1',   
            },
            'extraParams': [
            ],
        },
        'yuanhua': {
            "resolution": "1980x1080",
            'bandwidth': "21705000",
            copy: true,
        },
        /*'1080p': {
            'encodeParams':{
                '-f': "mpegts",
                '-vcodec': "libx264",
                '-acodec': "copy",
                '-b:v': "1500k",
                '-b:a': "128k",
                '-ar': "44100",
                '-threads': "2",
                '-vf': "scale=-2:1080",
                '-profile:v': 'high',   //baseline
            },
            'extraParams': [
            ],
        },*/
    }
}

module.exports = config