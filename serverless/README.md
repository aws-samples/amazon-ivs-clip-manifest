## Deployment Steps

### Install the lambda packages
```sh
cd lambda ; npm install ; cd ..
```

### Create a deployment bucket or use a existing bucket
If you already have a deployment bucket, jump this step.

```sh
aws s3api create-bucket --bucket <my-bucket-name> --region <my-region>
```

### Create the SAM package
```sh
sam package \
--template-file template.yaml \
```

### Deploy the package 
```sh
sam deploy \
--template-file packaged.yaml \
--stack-name sample-clip-manifest \
--capabilities CAPABILITY_IAM
```

### API Usage
To test you content  use:

```sh
curl -X POST <API Gateway Endpoint>/clipmanifest -H "Content-Type: application/json" -d "{\"start_time\": 1,\"end_time\": 15,\"master_url\": \"https://<url of the ivs recording>\"}"
```

example: 
```sh
curl -X POST https://nopxir0z9i.execute-api.us-east-1.amazonaws.com/Prod/clipmanifest/ -H "Content-Type: application/json" -d "{\"start_time\": 1,\"end_time\": 15,\"master_url\": \"https://d2a3twh6jpilo1.cloudfront.net/ivs/v1/098435415742/2rrcA103rn67/2022/9/9/22/21/volmNDWXmzSo/media/hls/master.m3u8\"}" 
```

### API Endpoints

#### Clip a manifest recording

Endpoint: `<ApiURL>/clipmanifest`<br />
Method: POST<br />
Content Type: JSON<br />
Payload:
```
{
  "start_time": 0,
  "end_time": 10,
  "master_url": "My-URL"
}
```
Response Code: 200<br />
Response Body:
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:15
#ID3-EQUIV-TDTG:2022-09-09T22:21:07
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-TWITCH-ELAPSED-SECS:1.000
#EXT-X-TWITCH-TOTAL-SECS:15.000
#EXT-X-PROGRAM-DATE-TIME:2022-09-09T22:21:07.121Z
#EXTINF:14.065,
0.ts
#EXT-X-PROGRAM-DATE-TIME:2022-09-09T22:21:21.186Z
#EXTINF:11.066,
1.ts
#EXT-X-ENDLIST
```

