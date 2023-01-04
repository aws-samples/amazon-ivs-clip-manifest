# Getting Started installing the backend API

The following steps show how to use AWS SAM to create a deployment build around [Amazon Simple Storage Service (Amazon S3), Amazon API Gateway and AWS Lambda, Amazon CloudFront. It also attach the Amazon CloudFront distribution to the Amazon S3 bucket, and apply the required policies to both.

The [AWS Serverless Application Model (AWS SAM)](https://aws.amazon.com/serverless/sam/) is an open-source framework for building serverless applications. Built on [AWS CloudFormation](https://aws.amazon.com/cloudformation/), AWS SAM provides shorthand syntax to declare serverless resources using JSON or YAML. During deployment, AWS SAM transforms the serverless resources into CloudFormation syntax, enabling you to build serverless applications faster. As a companion to AWS SAM, the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-reference.html#serverless-sam-cli) is a command line tool that operates on AWS SAM templates.

## Deployment Steps

#### 1. Cloning the Git repository

Clone the git repository of the Clip Manifest API for Amazon IVS:

```
git clone https://gitlab.aws.dev/osmarb/aws-ivs-manifest-clip.git
```


### 2. Install the lambda packages
```sh
cd aws-ivs-manifest-clip
cd lambda
npm install
cd ..
```

### 3. Create a deployment bucket or use an existing bucket
This bucket will host the deployment packages needed for the AWS SAM installation. 

If you already have a deployment bucket, jump this step.

```sh
aws s3api create-bucket --bucket <my-bucket-name> --region <my-region>
```

### 4. Create the SAM package
```sh
sam package \
--template-file template.yaml \
--s3-bucket <my-bucket-name> \
--output-template-file packaged.yaml
```

### 5. Deploy the package 
```sh
sam deploy \
--template-file packaged.yaml \
--stack-name sample-clip-manifest \
--capabilities CAPABILITY_IAM
```

It will take approximately 5 minutes to complete the Stack deployment. Take notes of the following outputs as you will be using them later.

```
ApiURLCreateClip
 API endpoint post create clips
 https://<your_API_id>.execute-api.us-east-1.amazonaws.com/Prod/clipmanifest/

RecordConfiguration
Recording Bucket Name
my-new-ivs-recording-bucket-standalone-api<account_id>
 
CloudfrontDistribution
 Amazon CloudFront Domain Name
 https://<your_cloudfront_id>.cloudfront.net

```

### 6. Amazon IVS Channel configuration

If you already have an Amazon IVS channel created that you want to use, you can skip this step.
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
```

### 7. Create the Amazon IVS Channel and link to your recording configuration*

```
aws ivs create-channel --name my-ivs-channel --recording-configuration-arn "<you-recording-arn>"
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
## About Amazon IVS
* Amazon Interactive Video Service (Amazon IVS) is a managed live streaming solution that is quick and easy to set up, and ideal for creating interactive video experiences. [Learn more](https://aws.amazon.com/ivs/).
* [Amazon IVS docs](https://docs.aws.amazon.com/ivs/)
* [User Guide](https://docs.aws.amazon.com/ivs/latest/userguide/)
* [API Reference](https://docs.aws.amazon.com/ivs/latest/APIReference/)
* [Learn more about Amazon IVS on IVS.rocks](https://ivs.rocks/)
* [View more demos like this](https://ivs.rocks/examples)