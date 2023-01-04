/// Author: Osmar Bento da Silva Junior - osmarb@

const AWS = require('aws-sdk')
const s3 = new AWS.S3()

exports.handler = async (event, context) => {
  console.log('Initializing Function Get S3 Recordings')
  const accountID = process.env.ACCOUNT_ID
  let vodjson = []
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
      console.log(error)
      return
    }
  }

  const recordings = await getRecordings()

  if (recordings) {
    recordings.Contents.forEach((element) => {
      let file = element.Key.substring(element.Key.lastIndexOf('/') + 1)
      if (file === 'master.m3u8') {
        let s3pathParsed = element.Key.split('/')
        let assetName = `Channel: ${s3pathParsed[3]} - Date: ${s3pathParsed[4]}-${s3pathParsed[5]}-${s3pathParsed[6]} ${s3pathParsed[7]}:${s3pathParsed[8]} - ID: ${s3pathParsed[9]}`
        vodjson.push({
          channel: s3pathParsed[3],
          year: s3pathParsed[4],
          month: s3pathParsed[5],
          day: s3pathParsed[6],
          hour: s3pathParsed[7],
          minute: s3pathParsed[8],
          recording: s3pathParsed[9],
          assetID: assetName,
          master: `${cfURL}/${element.Key}`
        })
      }
    })
  }

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    },
    body: JSON.stringify(vodjson)
  }
  return response
}
