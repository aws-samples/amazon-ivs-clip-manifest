## Deployment Steps
This install the standalone clipmanifest API **only**.

### Install the lambda packages
```sh
cd lambda ; npm install ; cd ..
```

### Create a deployment bucket or use an existing bucket
If you already have a deployment bucket, jump this step.

```sh
aws s3api create-bucket --bucket <my-bucket-name> --region <my-region>
```

### Create the SAM package
```sh
sam package \
--template-file template.yaml \
--s3-bucket <my-bucket-name> \
--output-template-file packaged.yaml
```

### Deploy the package 
```sh
sam deploy \
--template-file packaged.yaml \
--stack-name sample-clip-manifest \
--capabilities CAPABILITY_IAM
```

### API Usage

#### Get recordings API
```sh
curl -X GET <API Gateway Endpoint>/getrecordings
```

#### Get clips API
```sh
curl -X GET <API Gateway Endpoint>/getclips
```

#### Create clips API
```sh
curl -X POST <API Gateway Endpoint>/clipmanifest -H "Content-Type: application/json" -d "{\"start_time\": 1,\"end_time\": 15,\"master_url\": \"https://<url of the ivs recording>\"}"
```



example: 
```sh
curl -X POST https://nopxir0z9i.execute-api.us-east-1.amazonaws.com/Prod/clipmanifest/ -H "Content-Type: application/json" -d "{\"start_time\": 1,\"end_time\": 15,\"master_url\": \"https://d33pec9ri0pzqq.cloudfront.net/ivs/v1/098435415742/2rrcA103rn67/2022/10/15/2/11/X5JJ9FegmZiq/media/hls/master.m3u8\"}" 
```

### Test the clip
The new manifest follows the the path URL of the recording with the object called clip_master.m3u8
**Example:** 
  https://d33pec9ri0pzqq.cloudfront.net/ivs/v1/098435415742/2rrcA103rn67/2022/10/15/2/11/X5JJ9FegmZiq/media/hls/clip_master.m3u8

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


### 8. Testing the clipmanifest API 

After completing a live transmission to your Amazon IVS RTMPS endpoint, navigate to the Amazon S3 Recording Bucket, and look for the .m3u8 manifest. The Amazon S3 path should look like the below:

````
/ivs/v1/<aws_account_id>/<channel_id>/<year>/<month>/<day>/<hours>/<minutes>/<recording_id>/media/hls/720p30/playlist.m3u8
````

<img src="../doc/playlist_input.png" width=50%>


### 9. Using the create clips API

Make an HTTP Post call to the Amazon API Gateway endpoint.

```sh
curl -X POST <API Gateway Endpoint>/clipmanifest -H "Content-Type: application/json" -d "{\"start_time\": 1,\"end_time\": 15,\"master_url\": \"https://<url of the ivs recording>\"}"
```

example: 
```sh
curl -X POST https://nopxir0z9i.execute-api.us-east-1.amazonaws.com/Prod/clipmanifest/ -H "Content-Type: application/json" -d "{\"start_time\": 1,\"end_time\": 15,\"master_url\": \"https://<cloudfront_dist_id>.cloudfront.net/ivs/v1/<account_id>/2rrcA103rn67/2022/10/15/2/11/X5JJ9FegmZiq/media/hls/master.m3u8\"}" 
```

### 10. Test the clip

The new manifest follows the the path URL of the recording with the object called clip_master.m3u8


<img src="../doc/playlist_output.png" width=50%>


### Other APIs Usage


#### Get recordings API
```sh
curl -X GET <API Gateway Endpoint>/getrecordings
```

#### Get clips API
```sh
curl -X GET <API Gateway Endpoint>/getclips
```
