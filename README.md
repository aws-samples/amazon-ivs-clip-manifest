# Amazon IVS manifest clipping solution
The Amazon IVS manifest clipping solution offers a reference solution that demonstrates how you can use HTTP live streaming (HLS) Program-Date-Time (PDT) tags and HLS byte range manifest files to clip the recordings stored on [Amazon Simple Storage Service (Amazon S3)](https://aws.amazon.com/s3/) using the [Auto-Record to Amazon S3](https://docs.aws.amazon.com/ivs/latest/userguide/record-to-s3.html).

The solution offers two deployment options: 
- **[A. Application Web UI + APIs:](#option-a---deploy-the-complete-solution-web-ui--apis)** A front-end UI with backend APIs that offers a complete set to clip the recordings.
- **[B. Standalone API:](#option-b---deploy-the-standalone-api)** For developers only needing a reference clip API.


This is a serverless web application leveraging [Amazon IVS](https://aws.amazon.com/ivs/), [Amazon API Gateway](https://aws.amazon.com/api-gateway/), [AWS Lambda](https://aws.amazon.com/lambda/), [Amazon S3](https://aws.amazon.com/s3/) and [Amazon CloudFront](https://aws.amazon.com/cloudfront/). The sample Web UI is an application page built using [React.js](https://reactjs.org/) and [VideoJS](https://videojs.com/). The back-end is built using [Node.js](https://nodejs.org/), Amazon API Gateway, and AWS Lambda function used to [list all Amazon IVS recordings](/serverless/lambdas/getrecordings/), to [clip/trim the recordings](/serverless/lambdas/clipmanifest/) and [list all clipped recordings](/serverless/lambdas/getclips/). It also uses [AWS Serverless Application Model (AWS SAM)](https://aws.amazon.com/serverless/sam/), an open-source framework for building serverless applications.

## Solution Architecture

<img src="/doc/architecture.png" width=100%>

## Solution Web Application GUI

<img src="/doc/UI-Sample-Clip.png" width=100%>

## Prerequisites

- AWS CLI ([Installing or updating the latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- AWS SAM CLI ([Installing the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- NodeJS ([Installing Node.js](https://nodejs.org/))

**AWS Account:**
- 1. If you do not have an AWS account, please see [How do I create and activate a new Amazon Web Services account?](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)
- 2. Log into the [AWS console](https://console.aws.amazon.com/) *Note: If you are logged in as an IAM user, ensure your account has permissions to create and manage the necessary resources and components for this application.*


## Getting Started
 ⚠️**IMPORTANT NOTE:** *Deploying this demo application in your AWS account will create and consume AWS resources, which will cost money.*

**Deployment Options:**

### Option A - Deploy the complete solution (Application Web UI + APIs)
This option implements the complete solution with the back-end APIs needed for retrieving the recorded streams from Amazon IVS, clipping, and listing the clips.
- **[Application Web UI + APIs](/serverless/README.md)**
Deploy the Application UI, back-end AWS Lambda functions [clipmanifest](/serverless/lambdas/clipmanifest/), [getclips](/serverless/lambdas/getclips/) and [getrecordings](/serverless/lambdas/getrecordings/).

### Option B - Deploy the standalone API
This option implements only the clip manifest API. Therefore, it switches developers who already have an application to integrate with the clipmanifest API. 

- **[Standalone API](/standalone-api/README.md)**  
Deploy the backend AWS Lambda functions [clipmanifest](/serverless/lambdas/clipmanifest/).

## Contributing guidelines
See [CONTRIBUTING](CONTRIBUTING.md) for more information.

## License
This library is licensed under the MIT-0 License. See the LICENSE file.


## About Amazon IVS
* Amazon Interactive Video Service (Amazon IVS) is a managed live streaming solution that is quick and easy to set up, and ideal for creating interactive video experiences. [Learn more](https://aws.amazon.com/ivs/).
* [Amazon IVS docs](https://docs.aws.amazon.com/ivs/)
* [User Guide](https://docs.aws.amazon.com/ivs/latest/userguide/)
* [API Reference](https://docs.aws.amazon.com/ivs/latest/APIReference/)
* [Learn more about Amazon IVS on IVS.rocks](https://ivs.rocks/)
* [View more demos like this](https://ivs.rocks/examples)
