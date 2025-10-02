# Amazon IVS Clip Manifest - Public UI Deployment

Deploy the React UI to a public CloudFront distribution for sharing.

## 🚀 Quick Deploy

```bash
# Build the React app
npm run build

# Deploy to public hosting
cd public-deploy
sam deploy --guided
```

## 📋 What Gets Deployed

- **S3 Bucket** - Static website hosting
- **CloudFront Distribution** - Global CDN
- **Public Access** - Shareable URL for the UI

## 🔧 Configuration

The deployment will:
1. Upload the built React app to S3
2. Configure CloudFront for SPA routing
3. Provide a public URL for access

## 🔗 Related

- [UI Development](../README.md)
- [Backend APIs](../../serverless/README.md)
- [Main Documentation](../../README.md)
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

## 5- Upload the build to the Amazon S3 hosting bucket 
The hosting bucket information can be obtained in the output of the ```sam deploy``` step 3

```sh
aws s3 sync ../build/ s3://hosting-ivs-manifest-clip<account-id>
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

