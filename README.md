# IVS Manifest Clipping Web Demo
A demo web application for demonstrating how you can use Amazon IVS in conjunction with Amazon API Gateway and AWS Lambda to clip/trim content based on PDT information of the HLS manifest. 

This is a serverless web application leveraging [Amazon IVS](https://aws.amazon.com/ivs/), [Amazon API Gateway](https://aws.amazon.com/api-gateway/), [AWS Lambda](https://aws.amazon.com/lambda/), [Amazon S3](https://aws.amazon.com/s3/) and [Amazon CloudFront](https://aws.amazon.com/cloudfront/). The sample frontend is an application page built using [React.js](https://reactjs.org/) and [VideoJS](https://videojs.com/) and backend is built using [Node.js](https://nodejs.org/), Amazon API Gateway and AWS Lambda functions used to [list all Amazon IVS recordings](/serverless/lambdas/getrecordings/), to [clip/trim the recordings](/serverless/lambdas/clipmanifest/) and [list all clipped recordings](/serverless/lambdas/getclips/).

## Solution Architecture



## Deployment Steps

### Prerequisites


- AWS CLI ([Installing or updating the latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- AWS SAM CLI ([Installing the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- NodeJS ([Installing Node.js](https://nodejs.org/))

### Getting Started

 ⚠️**IMPORTANT NOTE:** *Deploying this demo application in your AWS account will create and consume AWS resources, which will cost money.*

To get the demo running in your own AWS account, follow these instructions.

1. If you do not have an AWS account, please see [How do I create and activate a new Amazon Web Services account?](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)
2. Log into the [AWS console](https://console.aws.amazon.com/) if you are not already. Note: If you are logged in as an IAM user, ensure your account has permissions to create and manage the necessary resources and components for this application.
3. Follow the instructions for deploying to AWS.

### Deployment Options


### [1. Deploy the backend severless app](/serverless/README.md)
Deploy the backend AWS lambda functions needed to clip the content based on the URL.

### [2. Deploy the frontend web app (Optional)](/manifest-clip-ui/README.md) 

Deploy the frontend web application on top of the backend serverless app



### Contributing guidelines
See [CONTRIBUTING](CONTRIBUTING.md) for more information.

### License
This library is licensed under the MIT-0 License. See the LICENSE file.


