# Amazon IVS manifest clipping: Publish the frontend
If you would like to publish the Frontend manifest-clip-ui please follow the deployment steps bellow.

## 1- Go to the publishing temple folder

```sh
cd aws-ivs-manifest-clip/manifest-clip-ui/public-deploy
```

## 2- Now use SAM package to upload the template to the Amazon S3 Bucket
You can use the same deployment bucket used in the backend deployment

```sh
sam package \
--template-file template.yaml \
--s3-bucket <your-deployment-bucket>\
--output-template-file packaged.yaml
```

## 3- Deploy using sam deploy
```sh
sam deploy \
--template-file packaged.yaml \
--stack-name sample-clip-manifest-ui \
--capabilities CAPABILITY_IAM
```

You should have the following output, take note of the output, you will need in following steps.

```
Outputs                                                                                                     
-------------------------------------------------------------------------------------------------------------
Key                 S3Bucket                                                                                
Description         S3 bucket                                                                               
Value               hosting-ivs-manifest-clip<account_id>                                                   

Key                 CloudfrontDistribution                                                                  
Description         Amazon CloudFront Domain Name                                                           
Value               https://<Distribution_id>.cloudfront.net                                                   
------------------------------------------------------------------------------------------------------------
```

## 4- Now you can build your React project

```sh
cd ..
npm run build
```

## 5- Upload the build to the Amazon S3 hosting bucket 
The hosting bucket information can be obtained in the output of the ```sam deploy``` step 3

```sh
aws s3 sync build/ s3://hosting-ivs-manifest-clip<account-id>
```

## 6- Access the Amazon CloudFront Domain URL
Information available in the output of the ```sam deploy```, step 3 

```
Key                 CloudfrontDistribution                                                                  
Description         Amazon CloudFront Domain Name                                                           
Value               https://<Distribution_id>.cloudfront.net      
```

<img src="/doc/UI-Sample-Clip.png" width=100%>

[Return to home page of the solution](../../README.md)

