// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')

const s3Client = new S3Client({ region: process.env.AWS_REGION })

exports.handler = async (event, context) => {
  console.log('Initializing Function Get S3 Recordings')
  const accountID = process.env.ACCOUNT_ID
  const cfURL = process.env.CLOUDFRONT_DOMAIN_NAME
  const bucket = process.env.STORAGE_IVSRECORDINGS_BUCKETNAME

  async function listManifests(prefix, manifestName) {
    const params = {
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 1000
    }
    const results = []
    let continuationToken = undefined

    do {
      if (continuationToken) {
        params.ContinuationToken = continuationToken
      }

      const command = new ListObjectsV2Command(params)
      const response = await s3Client.send(command)

      if (response?.Contents) {
        const manifests = response.Contents.filter((obj) =>
          obj.Key.endsWith(`/${manifestName}`)
        )
        results.push(...manifests)
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return results
  }

  function parseStandardRecording(key) {
    const parts = key.split('/')
    if (parts.length < 10) return null

    return {
      channel: parts[3],
      year: parts[4],
      month: parts[5],
      day: parts[6],
      hour: parts[7],
      minute: parts[8],
      recording: parts[9],
      assetID: `Channel: ${parts[3]} - Date: ${parts[4]}-${parts[5]}-${parts[6]} ${parts[7]}:${parts[8]} - ID: ${parts[9]}`,
      path: parts.slice(0, parts.indexOf('media')).join('/'),
      master: `${cfURL}/${key}`,
      type: 'standard'
    }
  }

  function parseRTRecording(key) {
    // RT paths: {stageId}/{sessionId}/{participantId}/{timestamp}/media/hls/multivariant.m3u8
    // Or: rt/composite/media/hls/multivariant.m3u8 (copied recordings)
    const parts = key.split('/')
    const mediaIdx = parts.indexOf('media')
    if (mediaIdx < 1) return null

    const pathBeforeMedia = parts.slice(0, mediaIdx)
    const isComposite = parts.includes('composite')

    // Try to extract timestamp from path for display
    const timestampPart = pathBeforeMedia.find(p => /^\d{4}-\d{2}-\d{2}T/.test(p))
    const dateDisplay = timestampPart
      ? timestampPart.replace('T', ' ').replace(/-/g, '/').substring(0, 16)
      : 'Unknown date'

    const stageId = pathBeforeMedia[0] || 'unknown'
    const recordingType = isComposite ? 'Composite' : 'Individual'

    return {
      channel: stageId,
      year: timestampPart ? timestampPart.substring(0, 4) : '',
      month: timestampPart ? timestampPart.substring(5, 7) : '',
      day: timestampPart ? timestampPart.substring(8, 10) : '',
      hour: timestampPart ? timestampPart.substring(11, 13) : '',
      minute: timestampPart ? timestampPart.substring(14, 16) : '',
      recording: pathBeforeMedia[pathBeforeMedia.length - 1],
      assetID: `[RT ${recordingType}] Stage: ${stageId} - ${dateDisplay}`,
      path: parts.slice(0, parts.length - 1).join('/'),
      master: `${cfURL}/${key}`,
      type: 'realtime'
    }
  }

  try {
    const vodData = []

    // Standard IVS recordings
    const standardManifests = await listManifests(`ivs/v1/${accountID}/`, 'master.m3u8')
    for (const manifest of standardManifests) {
      const parsed = parseStandardRecording(manifest.Key)
      if (parsed) vodData.push(parsed)
    }

    // Sample colorbar recordings (account 000000000000)
    const sampleManifests = await listManifests('ivs/v1/000000000000/', 'master.m3u8')
    for (const manifest of sampleManifests) {
      const parsed = parseStandardRecording(manifest.Key)
      if (parsed) vodData.push(parsed)
    }

    // RT recordings (scan for multivariant.m3u8 outside the ivs/ prefix)
    const allManifests = await listManifests('', 'multivariant.m3u8')
    for (const manifest of allManifests) {
      // Skip anything under ivs/ (standard recordings don't use multivariant.m3u8)
      if (manifest.Key.startsWith('ivs/')) continue
      const parsed = parseRTRecording(manifest.Key)
      if (parsed) vodData.push(parsed)
    }

    console.log('Total recordings found:', vodData.length)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify(vodData)
    }
  } catch (error) {
    console.error('Error fetching recordings:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ error: error.message })
    }
  }
}
