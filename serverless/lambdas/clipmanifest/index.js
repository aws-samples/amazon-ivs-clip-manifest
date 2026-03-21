// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

'use strict'

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} = require('@aws-sdk/client-s3')

const {
  validateRequiredFields,
  validateEndTime,
  validateNumericFields,
  validateByteRange,
  parseMaster,
  clipPlaylistByPDT,
  createPlaylistManifest,
  rewriteMaster
} = require('../../lib')

const s3Bucket = process.env.STORAGE_IVSRECORDINGS_BUCKETNAME
const s3Client = new S3Client({ region: process.env.AWS_REGION })

exports.handler = async (event) => {
  try {
    // (1) Parse and validate input
    let startTime, endTime, urlMaster, byteRange
    try {
      ;({
        start_time: startTime,
        end_time: endTime,
        master_url: urlMaster,
        byte_range: byteRange
      } = JSON.parse(event.body))
    } catch (error) {
      throw Object.assign(
        new Error(`JSON parse error ${error}, please check the API documentation`),
        { statusCode: 400 }
      )
    }

    validateRequiredFields({ startTime, endTime, urlMaster, byteRange })
    validateEndTime({ startTime, endTime })
    validateNumericFields({ startTime, endTime })

    const masterURL = new URL(urlMaster).pathname
    const pathName = masterURL.replace('/master.m3u8', '')
    const s3BucketFolder = s3Bucket + pathName
    const executionTime = Date.now()

    // (2) Fetch master manifest from S3
    const rawMasterManifest = await getManifestFromS3(
      byteRange
        ? masterURL.replace('master.m3u8', 'byte-range-multivariant.m3u8')
        : masterURL
    )

    validateByteRange(rawMasterManifest, byteRange)

    if (rawMasterManifest === null) {
      throw Object.assign(new Error('Master manifest not found'), { statusCode: 404 })
    }

    // (3) Parse master → fetch first playlist → clip → generate new manifests
    const mediaPlaylists = parseMaster(rawMasterManifest)
    const playlistURL = `${pathName}/${mediaPlaylists[0].uri}`
    const rawPlaylistManifest = await getManifestFromS3(playlistURL)

    const { segments: filteredSegments, genericExt } = clipPlaylistByPDT(
      rawPlaylistManifest, startTime, endTime, byteRange
    )
    const newPlaylist = createPlaylistManifest(filteredSegments, genericExt)
    const newMaster = rewriteMaster(rawMasterManifest, mediaPlaylists, executionTime)

    // (4) Write clip manifests to S3
    const writePromises = []

    writePromises.push(
      writeToS3(newMaster, `${executionTime}_clip_master.m3u8`, s3BucketFolder)
    )

    for (const playlist of mediaPlaylists) {
      writePromises.push(
        writeToS3(newPlaylist, `${executionTime}_clip_playlist.m3u8`, `${s3BucketFolder}/${playlist.base}`)
      )
    }

    await Promise.all(writePromises)

    // (5) Return response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify([{
        execution: executionTime,
        path: pathName,
        bucket: s3Bucket,
        clip_master: `${s3BucketFolder}/${executionTime}_clip_master.m3u8`,
        master_url: `${process.env.CLOUDFRONT_DOMAIN_NAME}${pathName}/${executionTime}_clip_master.m3u8`
      }])
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ error: error.message })
    }
  }
}

async function getManifestFromS3(key) {
  try {
    const command = new GetObjectCommand({ Bucket: s3Bucket, Key: key.slice(1) })
    const response = await s3Client.send(command)
    return await response.Body.transformToString()
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) return null
    throw error
  }
}

async function writeToS3(body, filename, location) {
  const pathAfterBucket = location.replace(s3Bucket, '')
  const command = new PutObjectCommand({
    Body: body,
    Bucket: s3Bucket,
    Key: `${pathAfterBucket}/${filename}`.replace(/^\/+/, ''),
    ContentType: 'application/x-mpegURL'
  })
  return s3Client.send(command)
}
