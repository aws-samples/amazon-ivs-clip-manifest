// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')

const s3Client = new S3Client({ region: process.env.AWS_REGION })

exports.handler = async (event, context) => {
  console.log('Initializing Function Get S3 Recordings')
  const accountID = process.env.ACCOUNT_ID
  const cfURL = process.env.CLOUDFRONT_DOMAIN_NAME

  async function getRecordings() {
    const params = {
      Bucket: process.env.STORAGE_IVSRECORDINGS_BUCKETNAME,
      Prefix: `ivs/v1/${accountID}/`,
      MaxKeys: 1000 // Limit to 1000 recordings
    }
    const vodData = []
    let continuationToken = undefined

    try {
      do {
        if (continuationToken) {
          params.ContinuationToken = continuationToken
        }

        const command = new ListObjectsV2Command(params)
        const recordings = await s3Client.send(command)

        if (!recordings?.Contents) {
          break
        }

        console.log('Recordings Found:', recordings.Contents.length)

        // Filter for master.m3u8 files and process them
        const masterFiles = recordings.Contents.filter((recording) =>
          recording.Key.endsWith('/master.m3u8')
        )

        for (const recording of masterFiles) {
          console.log('Found Master Manifest:', recording.Key)
          const s3pathParsed = recording.Key.split('/')
          const pathLength = s3pathParsed.length

          // Only process if we have enough path segments
          if (pathLength >= 10) {
            let assetName = `Channel: ${s3pathParsed[3]} - Date: ${s3pathParsed[4]}-${s3pathParsed[5]}-${s3pathParsed[6]} ${s3pathParsed[7]}:${s3pathParsed[8]} - ID: ${s3pathParsed[9]}`
            vodData.push({
              channel: s3pathParsed[3],
              year: s3pathParsed[4],
              month: s3pathParsed[5],
              day: s3pathParsed[6],
              hour: s3pathParsed[7],
              minute: s3pathParsed[8],
              recording: s3pathParsed[9],
              assetID: assetName,
              path: s3pathParsed.slice(0, pathLength - 1).join('/'),
              master: `${cfURL}/${recording.Key}`
            })
          }
        }

        continuationToken = recordings.NextContinuationToken
      } while (continuationToken)

      return vodData
    } catch (error) {
      console.error('Error fetching recordings:', error)
      return []
    }
  }

  const vodData = await getRecordings()
  console.log('Total recordings found:', vodData.length)

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    },
    body: JSON.stringify(vodData)
  }
  return response
}
