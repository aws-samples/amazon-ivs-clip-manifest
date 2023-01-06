/// Author: Osmar Bento da Silva Junior - osmarb@

const AWS = require('aws-sdk')
const s3 = new AWS.S3()

exports.handler = async (event, context) => {
  console.log('Initializing Function Get S3 Recordings')
  const accountID = process.env.ACCOUNT_ID
  const cfURL = process.env.CLOUDFRONT_DOMAIN_NAME

  async function getRecordings() {
    const params = {
      Bucket: process.env.STORAGE_IVSRECORDINGS_BUCKETNAME,
      Prefix: `ivs/v1/${accountID}/`
    }
    try {
      const recordings = await s3.listObjects(params).promise()
      return recordings
    } catch (error) {
      console.error(error)
      throw new Error('Error on getting recordings')
    }
  }

  const recordings = await getRecordings()
  const vodData = []

  if (recordings) {
    for (const recording of recordings.Contents) {
      let file = recording.Key.substring(recording.Key.lastIndexOf('/') + 1)
      if (file === 'master.m3u8') {
        const s3pathParsed = recording.Key.split('/')
        const pathLength = s3pathParsed.length
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
  }

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
