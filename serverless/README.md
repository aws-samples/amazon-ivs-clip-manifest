# Amazon IVS manifest clipping: Application Web UI + APIs

The following steps show how to use AWS SAM to create a deployment build around [Amazon Simple Storage Service (Amazon S3)](https://aws.amazon.com/s3/), [Amazon API Gateway](https://aws.amazon.com/api-gateway/), and [AWS Lambda](https://aws.amazon.com/lambda/), [Amazon CloudFront](https://aws.amazon.com/cloudfront/). It also attaches the Amazon CloudFront distribution to the Amazon S3 bucket and applies the required policies.
Finally, you can run the Web UI application component locally sto render your recordings and manage your clips.

The [AWS Serverless Application Model (AWS SAM)](https://aws.amazon.com/serverless/sam/) is an open-source framework for building serverless applications. Built on [AWS CloudFormation](https://aws.amazon.com/cloudformation/), AWS SAM provides shorthand syntax to declare serverless resources using JSON or YAML. During deployment, AWS SAM transforms the serverless resources into CloudFormation syntax, enabling you to build serverless applications faster. As a companion to AWS SAM, the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-reference.html#serverless-sam-cli) is a command line tool that operates on AWS SAM templates.

## Solution Architecture

<img src="/doc/architecture.png" width=85%>

## Deployment Steps

### 1. Cloning the Git repository

Clone the git repository of the Clip Manifest API for Amazon IVS:

```
git clone https://github.com/aws-samples/amazon-ivs-clip-manifest.git
cd amazon-ivs-clip-manifest/serverless/
```

### 2. Create a deployment bucket or use an existing bucket
This bucket will host the deployment packages needed for the AWS SAM installation. 

If you already have a deployment bucket, jump this step.

```sh
aws s3api create-bucket --bucket <my-bucket-name> --region <my-region>
```

### 3. Create the SAM package
```sh
sam package \
--template-file template.yaml \
--s3-bucket <my-bucket-name> \
--output-template-file packaged.yaml
```

### 4. Deploy the package 
```sh
sam deploy \
--template-file packaged.yaml \
--stack-name sample-clip-manifest \
--capabilities CAPABILITY_IAM
```

It will take approximately 5 minutes to complete the Stack deployment. Take notes of the following outputs as you will be using them later.

```
loudFormation outputs from deployed stack
-----------------------------------------------------------------------------------------------------------------------------------
Outputs                                                                                                                           
-----------------------------------------------------------------------------------------------------------------------------------
Key                 ApiURLCreateClip                                                                                              
Description         API endpoint post create clips                                                                                
Value               https://<id>.execute-api.us-east-1.amazonaws.com/Prod/clipmanifest/                                     

Key                 ApiURLGetRecordings                                                                                           
Description         API endpoint get recordings available                                                                         
Value               https://<id>.execute-api.us-east-1.amazonaws.com/Prod/getrecordings/                                    

Key                 ApiURLGetClips                                                                                                
Description         API endpoint get clips available                                                                              
Value               https://<id>.execute-api.us-east-1.amazonaws.com/Prod/getclips/                                         

Key                 CloudfrontDistribution                                                                                        
Description         Amazon CloudFront Domain Name                                                                                 
Value               https://<id>.cloudfront.net                                                                         

Key                 RecordConfigurationBucket                                                                                     
Description         Recoding Bucket Name                                                                                          
Value               my-new-ivs-recording-bucket-<account-number>                                                                      
-----------------------------------------------------------------------------------------------------------------------------------
```


### 5. Amazon IVS Channel configuration

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

### 6. Create the Amazon IVS Channel and link to your recording configuration*

```
aws ivs create-channel --name my-ivs-channel --recording-configuration-arn "<you-recording-arn>"
```

### 7. Extract the Outputs from the SAM package to pass as parameters to Web UI 

```sh
aws cloudformation describe-stacks --stack-name sample-clip-manifest --query 'Stacks[].Outputs' > ../manifest-clip-ui/src/config.json 
```

### 8. Running the Web UI Application locally

```sh
cd ../manifest-clip-ui
npm install
npm start
```

<img src="/doc/UI-Sample-Clip.png" width=100%>


## Publishing and hosting the Web UI Application
Congratulations on building the Amazon IVS clip manifest solution! With the base application complete with backend API and the local WebUI installed, it's time to choose if you want to demonstrate to a broader audience.

- [Public Hosting](../manifest-clip-ui/public-deploy/README.md) - Publish the web application to the Public internet. After completing this exension, you'll be able to share a URL with the complete solution.
