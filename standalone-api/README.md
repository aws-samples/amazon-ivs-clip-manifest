# Amazon IVS Clip Manifest - Standalone API

Deploy only the clip manifest API for integration with existing applications.

## 🚀 Quick Deploy

```bash
sam deploy --guided
```

## 📡 API Reference

### POST /clipmanifest

Creates a video clip from an IVS recording using manifest manipulation.

**Request Body:**
```json
{
  "start_time": 1640995200,
  "end_time": 1640995260,
  "master_url": "https://your-cloudfront-domain.net/ivs/v1/123456789/recording/path/master.m3u8",
  "byte_range": true
}
```

**Response:**
```json
{
  "clip_url": "https://your-cloudfront-domain.net/clips/clip_1640995200_1640995260.m3u8",
  "duration": 60,
  "created_at": "2024-01-01T10:00:00Z"
}
```

## 🔧 Integration Example

```javascript
const response = await fetch('https://your-api-gateway-url/clipmanifest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    start_time: Math.floor(startDate.getTime() / 1000),
    end_time: Math.floor(endDate.getTime() / 1000),
    master_url: recordingUrl,
    byte_range: true
  })
});

const clip = await response.json();
console.log('Clip created:', clip.clip_url);
```

## 📋 What Gets Deployed

- **Lambda Function** - Clip manifest processing
- **API Gateway** - REST endpoint
- **S3 Bucket** - Storage for clips and recordings
- **CloudFront** - CDN for content delivery

## 🔗 Related

- [Full Solution with UI](../serverless/README.md)
- [Frontend Components](../manifest-clip-ui/README.md)
 https://<your_API_id>.execute-api.us-east-1.amazonaws.com/Prod/clipmanifest/

RecordConfiguration                                                            
  RecordingBucketName
  my-new-ivs-recording-bucket-standalone-api<account_id>
 
CloudfrontDistribution
 Amazon CloudFront Domain Name
 https://<your_cloudfront_id>.cloudfront.net
```

## 5. Amazon IVS Channel configuration

**Note:If you already have an Amazon IVS channel created that you want to use, you can skip this step.**
Copy from the AWS SAM deploy output the recording bucket name and replace the "Your Recording Bucket Name" below.

```
aws ivs create-recording-configuration \
    --name "my-recording-config" \
    --recording-reconnect-window-seconds 60 \
    --destination-configuration s3={bucketName=<Your Recording Bucket Name>} \
    --thumbnail-configuration recordingMode="INTERVAL",targetIntervalSeconds=30
```

Take note of the RecordingConfiguration ARN, as it will be used to link your recording configuration.

```
"recordingConfiguration": {
        "arn": "arn:aws:ivs:us-east-1:my_account_id:recording-configuration/unique_id",
        "destinationConfiguration": {
            "s3": {
                "bucketName": "my-new-ivs-recording-bucket-standalone-api-my_account_id"
            }
        }
}
```

## 6. Create the Amazon IVS Channel and link to your recording configuration*

```
aws ivs create-channel --name my-ivs-channel --recording-configuration-arn "<you-recording-arn>"
```

## 7. Testing the clipmanifest API 

After completing a live transmission to your Amazon IVS RTMPS endpoint, navigate to the Amazon S3 Recording Bucket, and look for the .m3u8 manifest. The Amazon S3 path should look like the below:

````
/ivs/v1/<aws_account_id>/<channel_id>/<year>/<month>/<day>/<hours>/<minutes>/<recording_id>/media/hls/720p30/playlist.m3u8
````

<img src="../doc/playlist_input.png" width=70%>


## 8. Using the create clips API

Make an HTTP Post call to the Amazon API Gateway endpoint.

```sh
curl -X POST <API Gateway Endpoint>/clipmanifest -H "Content-Type: application/json" -d "{\"start_time\": 20,\"end_time\": 70,\"master_url\": \"https://<url of the ivs recording>\", \"byte_range\": true}"
```

Example: 
```sh
curl -X POST https://<unique_id>.execute-api.us-east-1.amazonaws.com/Prod/clipmanifest/ -H "Content-Type: application/json" -d "{\"start_time\": 20,\"end_time\": 70,\"master_url\": \"https://<cloudfront_dist_id>.cloudfront.net/ivs/v1/<account_id>/2rrcA103rn67/2022/10/15/2/11/X5JJ9FegmZiq/media/hls/master.m3u8\", \"byte_range\": true}" 
```

**Note: The API Gateway unique_id can be found in the AWS SAM deploy output, as well as the CloudFront endpoint can be found in the AWS SAM deploy output.**


## 9. Test the clip

The new manifest follows the path URL of the recording with the object called clip_master.m3u8

<img src="../doc/playlist_output.png" width=70%>


[Return to home page of the solution](../README.md)