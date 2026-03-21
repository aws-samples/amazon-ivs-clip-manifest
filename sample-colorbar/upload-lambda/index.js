// Custom resource Lambda: uploads sample-colorbar HLS fixtures to S3 at deploy time.
'use strict'

const { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const path = require('path')
const fs = require('fs')
const https = require('https')
const url = require('url')

const s3Client = new S3Client({})

const SAMPLE_PREFIX = 'ivs/v1/000000000000/TestChannel/2024/01/01/00/00/SampleColorBar/media/hls'

const CONTENT_TYPES = {
  '.m3u8': 'application/x-mpegURL',
  '.ts': 'video/mp2t'
}

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event))
  const bucket = event.ResourceProperties.BucketName

  try {
    if (event.RequestType === 'Delete') {
      await deleteSampleData(bucket)
    } else {
      // Create or Update
      await uploadSampleData(bucket)
    }
    await sendResponse(event, context, 'SUCCESS', { Message: `Sample colorbar ${event.RequestType.toLowerCase()}d` })
  } catch (err) {
    console.error(err)
    await sendResponse(event, context, 'FAILED', { Error: err.message })
  }
}

async function uploadSampleData(bucket) {
  const dataDir = path.join(__dirname, 'data')
  const files = getAllFiles(dataDir)

  const uploads = files.map(filePath => {
    const key = path.relative(dataDir, filePath)
    const ext = path.extname(filePath)
    const body = fs.readFileSync(filePath)

    console.log(`Uploading: ${key} (${body.length} bytes)`)
    return s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: CONTENT_TYPES[ext] || 'application/octet-stream'
    }))
  })

  await Promise.all(uploads)
  console.log(`Uploaded ${files.length} files to s3://${bucket}/`)
}

async function deleteSampleData(bucket) {
  const listResp = await s3Client.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: SAMPLE_PREFIX
  }))

  if (!listResp.Contents || listResp.Contents.length === 0) {
    console.log('No sample data to delete')
    return
  }

  const objects = listResp.Contents.map(obj => ({ Key: obj.Key }))
  console.log(`Deleting ${objects.length} sample objects`)

  await s3Client.send(new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: { Objects: objects }
  }))
}

function getAllFiles(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath))
    } else {
      results.push(fullPath)
    }
  }
  return results
}

// CFN custom resource response helper
async function sendResponse(event, context, status, data) {
  const body = JSON.stringify({
    Status: status,
    Reason: `See CloudWatch Log Stream: ${context.logStreamName}`,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: data
  })

  const parsed = url.parse(event.ResponseURL)
  const options = {
    hostname: parsed.hostname,
    port: 443,
    path: parsed.path,
    method: 'PUT',
    headers: {
      'Content-Type': '',
      'Content-Length': body.length
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, resolve)
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}
