/// Author: Osmar Bento da Silva Junior - osmarb@

const AWS = require('aws-sdk')
const s3 = new AWS.S3()

exports.handler = async (event, context) => {
  console.log('Initializing Function Get S3 Recordings')
  let channelID = event.path.split('/')[1]
  let year = event.path.split('/')[2]
  let mo = event.path.split('/')[3]
  let day = event.path.split('/')[4]
  let hours = event.path.split('/')[5]
  let minutes = event.path.split('/')[6]
  let recordingID = event.path.substring(event.path.lastIndexOf('/') + 1)

  console.log(channelID, year, mo, day, hours, minutes, recordingID)

  let accountID = process.env.ACCOUNT_ID
  let vodjson = []
  let CFDistrib = process.env.CLOUDFRONT_DOMAIN_NAME

  async function getClips() {
    const params = {
      Bucket: process.env.STORAGE_IVSRECORDINGS_BUCKETNAME,
      Prefix: `ivs/v1/${accountID}/${channelID}/${year}/${mo}/${day}/${hours}/${minutes}/${recordingID}`
    }
    let recordings = await s3.listObjects(params).promise()
    return recordings
  }

  const clips = await getClips()
  //console.log('Recordings', recordings)

  clips.Contents.forEach((element) => {
    // push only the elements that we need
    let file = element.Key.substring(element.Key.lastIndexOf('/') + 1)
    const target = new RegExp('clip_master*')
    if (target.test(file)) {
      console.log('MASTER', element.Key)
      let ch = element.Key.split('/')[3]
      let yr = element.Key.split('/')[4]
      let mo = element.Key.split('/')[5]
      let dy = element.Key.split('/')[6]
      let hr = element.Key.split('/')[7]
      let mi = element.Key.split('/')[8]
      let pd = `${yr}-${mo}`
      let fd = `${yr}-${mo}-${dy}-${hr}-${mi}`
      let rid = element.Key.split('/')[9]
      let mplay = `${CFDistrib}/${element.Key}`
      let tumb = `${CFDistrib}/${element.Key.split('/')[0]}/${
        element.Key.split('/')[1]
      }/${element.Key.split('/')[2]}/${element.Key.split('/')[3]}/${
        element.Key.split('/')[4]
      }/${element.Key.split('/')[5]}/${element.Key.split('/')[6]}/${
        element.Key.split('/')[7]
      }/${element.Key.split('/')[8]}/${element.Key.split('/')[9]}/${
        element.Key.split('/')[10]
      }/thumbnails/thumb5.jpg`
      let splay = `${CFDistrib}/${element.Key.split('/')[0]}/${
        element.Key.split('/')[1]
      }/${element.Key.split('/')[2]}/${element.Key.split('/')[3]}/${
        element.Key.split('/')[4]
      }/${element.Key.split('/')[5]}/${element.Key.split('/')[6]}/${
        element.Key.split('/')[7]
      }/${element.Key.split('/')[8]}/${element.Key.split('/')[9]}/${
        element.Key.split('/')[10]
      }/hls/480p30/playlist.m3u8`

      console.log('TUMB', tumb)
      let il = 'NO'

      vodjson.push({
        channel: ch,
        year: yr,
        month: mo,
        day: dy,
        hour: hr,
        minute: mi,
        pardate: pd,
        fulldate: fd,
        recordingid: rid,
        masterplaylist: mplay,
        subplaylist: splay,
        islive: il,
        thumbnails: tumb
      })
    }
  })

  console.log('This has to be a JSON', vodjson)

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
