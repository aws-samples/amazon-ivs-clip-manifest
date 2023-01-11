/// Author: Osmar Bento da Silva Junior - osmarb@

const AWS = require('aws-sdk')
const s3 = new AWS.S3()

exports.handler = async (event, context) => {
  console.log('Initializing Function Get S3 Clips')
  const vodPath = event.queryStringParameters
  console.log(vodPath.vod)
  let clipjson = []
  const cfURL = process.env.CLOUDFRONT_DOMAIN_NAME

  async function getClips() {
    const params = {
      Bucket: process.env.STORAGE_IVSRECORDINGS_BUCKETNAME,
      Prefix: `${vodPath.vod}/`
    }
    try {
      const clips = await s3.listObjects(params).promise()
      return clips
    } catch (error) {
      console.log(error)
      return
    }
  }

  const clips = await getClips()

  if (clips) {
    clips.Contents.forEach((element) => {
      let file = element.Key.substring(element.Key.lastIndexOf('/') + 1)
      const target = new RegExp('clip_master*')
      if (target.test(file)) {
        let s3pathParsed = element.Key.split('/')
        let assetName = `Channel: ${s3pathParsed[3]} - Date: ${s3pathParsed[4]}-${s3pathParsed[5]}-${s3pathParsed[6]} ${s3pathParsed[7]}:${s3pathParsed[8]} - ID: ${s3pathParsed[9]}`
        clipjson.push({
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
    body: JSON.stringify(clipjson)
  }
  return response
}
