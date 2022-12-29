Clip manifest API test document

## Project Configuration
0 - Environment deployed: sample
1- Project deployment SAM Bucket: sam-deploy-clip

2- Amazon IVS Recording Bucket: my-new-ivs-recording-bucket-098435415742

3- API endpoints: 
- ApiURLCreateClip: https://nopxir0z9i.execute-api.us-east-1.amazonaws.com/Prod/clipmanifest/
- ApiURLGetRecording: https://nopxir0z9i.execute-api.us-east-1.amazonaws.com/Prod/getrecordings/

4- CloudFormaion endpoint
- ClouddorntDistribution: https://d1vzkjoets0sdc.cloudfront.net

## Packaging commands

**SAM Package**
```sh
sam package \
--template-file template.yaml \
--s3-bucket sam-deploy-clip \
--output-template-file packaged.yaml
```

**SAM Deploy**
```sh
sam deploy \
--template-file packaged.yaml \
--stack-name sample-clip-manifest \
--capabilities CAPABILITY_IAM
```

## Manifest Before Clipping:
**Source Master Manifest**
Object URL:https://my-new-ivs-recording-bucket-098435415742.s3.amazonaws.com/ivs/v1/098435415742/2rrcA103rn67/2022/11/16/1/8/lFOBQr3Hdzlg/media/hls/master.m3u8
```
#EXTM3U
#EXT-X-SESSION-DATA:DATA-ID="net.live-video.customer.id",VALUE="098435415742"
#EXT-X-SESSION-DATA:DATA-ID="net.live-video.content.id",VALUE="2rrcA103rn67"
#EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="720p30",NAME="720p",AUTOSELECT=YES,DEFAULT=YES
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=2423400,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=1280x720,VIDEO="720p30"
720p30/playlist.m3u8
#EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="480p30",NAME="480p",AUTOSELECT=YES,DEFAULT=YES
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1478399,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=852x480,VIDEO="480p30"
480p30/playlist.m3u8
#EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="360p30",NAME="360p",AUTOSELECT=YES,DEFAULT=YES
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=630000,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=640x360,VIDEO="360p30"
360p30/playlist.m3u8
#EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="160p30",NAME="160p",AUTOSELECT=YES,DEFAULT=YES
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=230000,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=284x160,VIDEO="160p30"
160p30/playlist.m3u8
```

**Source Playlist Master Manifest**
Object URL: https://my-new-ivs-recording-bucket-098435415742.s3.amazonaws.com/ivs/v1/098435415742/2rrcA103rn67/2022/11/16/1/8/lFOBQr3Hdzlg/media/hls/720p30/playlist.m3u8
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:16
#ID3-EQUIV-TDTG:2022-11-16T01:15:35
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-TWITCH-ELAPSED-SECS:0.000
#EXT-X-TWITCH-TOTAL-SECS:413.976
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:08:38.542Z
#EXTINF:11.141,
0.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:08:49.683Z
#EXTINF:10.233,
1.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:08:59.916Z
#EXTINF:11.233,
2.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:09:11.149Z
#EXTINF:11.734,
3.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:09:22.883Z
#EXTINF:12.766,
4.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:09:35.649Z
#EXTINF:11.434,
5.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:09:47.083Z
#EXTINF:12.933,
6.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:10:00.016Z
#EXTINF:10.800,
7.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:10:10.816Z
#EXTINF:11.733,
8.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:10:22.549Z
#EXTINF:11.167,
9.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:10:33.716Z
#EXTINF:14.467,
10.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:10:48.183Z
#EXTINF:12.300,
11.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:11:00.483Z
#EXTINF:12.566,
12.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:11:13.049Z
#EXTINF:14.100,
13.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:11:27.149Z
#EXTINF:11.834,
14.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:11:38.983Z
#EXTINF:12.166,
15.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:11:51.149Z
#EXTINF:13.867,
16.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:12:05.016Z
#EXTINF:11.000,
17.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:12:16.016Z
#EXTINF:10.833,
18.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:12:26.849Z
#EXTINF:10.834,
19.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:12:37.683Z
#EXTINF:14.366,
20.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:12:52.049Z
#EXTINF:10.834,
21.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:13:02.883Z
#EXTINF:12.800,
22.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:13:15.683Z
#EXTINF:13.833,
23.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:13:29.516Z
#EXTINF:14.700,
24.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:13:44.216Z
#EXTINF:11.200,
25.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:13:55.416Z
#EXTINF:12.434,
26.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:14:07.850Z
#EXTINF:10.733,
27.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:14:18.583Z
#EXTINF:15.067,
28.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:14:33.650Z
#EXTINF:12.666,
29.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:14:46.316Z
#EXTINF:10.333,
30.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:14:56.649Z
#EXTINF:10.734,
31.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:15:07.383Z
#EXTINF:10.766,
32.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:15:18.149Z
#EXTINF:11.400,
33.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:15:29.549Z
#EXTINF:2.969,
34.ts
#EXT-X-ENDLIST
```

[Play the Source VOD](https://d1vzkjoets0sdc.cloudfront.net/ivs/v1/098435415742/2rrcA103rn67/2022/11/16/1/8/lFOBQr3Hdzlg/media/hls/master.m3u8)

## Using the Clip Manifest API:
```sh
curl -X POST https://nopxir0z9i.execute-api.us-east-1.amazonaws.com/Prod/clipmanifest/ -H "Content-Type: application/json" -d "{\"start_time\": 1,\"end_time\": 15,\"master_url\": \"https://d1vzkjoets0sdc.cloudfront.net/ivs/v1/098435415742/2rrcA103rn67/2022/11/16/1/8/lFOBQr3Hdzlg/media/hls/master.m3u8\"}" 
```

## Manifest After Clipping
**Output Master Manifest**
Object URL: https://my-new-ivs-recording-bucket-098435415742.s3.amazonaws.com/ivs/v1/098435415742/2rrcA103rn67/2022/11/16/1/8/lFOBQr3Hdzlg/media/hls/1670361684672_clip_master.m3u8
```
#EXTM3U
#EXT-X-SESSION-DATA:DATA-ID="net.live-video.customer.id",VALUE="098435415742"
#EXT-X-SESSION-DATA:DATA-ID="net.live-video.content.id",VALUE="2rrcA103rn67"
#EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="720p30",NAME="720p",AUTOSELECT=YES,DEFAULT=YES
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=2423400,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=1280x720,VIDEO="720p30"
720p30/clip.m3u8
#EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="480p30",NAME="480p",AUTOSELECT=YES,DEFAULT=YES
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1478399,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=852x480,VIDEO="480p30"
480p30/clip.m3u8
#EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="360p30",NAME="360p",AUTOSELECT=YES,DEFAULT=YES
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=630000,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=640x360,VIDEO="360p30"
360p30/clip.m3u8
#EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="160p30",NAME="160p",AUTOSELECT=YES,DEFAULT=YES
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=230000,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=284x160,VIDEO="160p30"
160p30/clip.m3u8
```

**Output Playlist Manifest**
Object URL: https://my-new-ivs-recording-bucket-098435415742.s3.amazonaws.com/ivs/v1/098435415742/2rrcA103rn67/2022/11/16/1/8/lFOBQr3Hdzlg/media/hls/720p30/clip.m3u8
[x]bug to be fixed, playlist manifest supposed to have version.
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:16
#ID3-EQUIV-TDTG:2022-11-16T01:08:38
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-TWITCH-ELAPSED-SECS:1.000
#EXT-X-TWITCH-TOTAL-SECS:15.000
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:08:38.542Z
#EXTINF:11.141,
0.ts
#EXT-X-PROGRAM-DATE-TIME:2022-11-16T01:08:49.683Z
#EXTINF:10.233,
1.ts
#EXT-X-ENDLIST
```

[Play the Output Clip](https://d1vzkjoets0sdc.cloudfront.net/ivs/v1/098435415742/2rrcA103rn67/2022/11/16/1/8/lFOBQr3Hdzlg/media/hls/1670362582722_clip_master.m3u8)