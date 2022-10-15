/// Author: Osmar Bento da Silva Junior - osmarb@amazon.com
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const https = require('https')
const m3u8Parser = require('m3u8-parser')
const url = require('url')
let newMaster = ''
let resp

exports.handler = async (event) => {
  // (1) parse event body
  let body = JSON.parse(event.body)
  let master_url = body.master_url
  let path = url.parse(master_url).pathname.replace('/master.m3u8', '')
  let location = `${process.env.STORAGE_IVSRECORDINGS_BUCKETNAME}${path}`
  let start_time = body.start_time
  let end_time = body.end_time

  // (2) get manifest and parse and create a list use as obj
  if (!master_url) return
  const masterManifest = await parseMaster(master_url)

  async function parseMaster(url) {
    console.log('parseMaster')
    let manifest = await getRequest(url)
    newMaster = manifest.toString().replace(/playlist/g, 'clip')
    var parser = new m3u8Parser.Parser()
    parser.push(manifest)
    parser.end()
    return parser.manifest
  }

  // (3) get the manifest and fiter the date time interval, create the new adaptative manifest
  const clipManifest = await clipAdaptative(masterManifest)

  async function clipAdaptative(master) {
    console.log('parseAdaptative')
    let clipMaifest = []
    let adaptativeURI = JSON.stringify(master.playlists[0].uri)
    let adaptativeURL = master_url.replace(
      'master.m3u8',
      adaptativeURI.replace(/"/g, '')
    )
    let manifest = await getRequest(adaptativeURL)
    var parser = new m3u8Parser.Parser()
    parser.push(manifest)
    parser.end()
    let parsedManifest = parser.manifest
    let streamStart = parsedManifest.segments[0].dateTimeObject.getTime()
    let clipStartAt = Math.floor(start_time * 1000 + streamStart)
    let clipEndAt = Math.floor(streamStart + end_time * 1000)

    clipMaifest = parsedManifest.segments.filter((item) => {
      let date = item.dateTimeObject.getTime()
      let endDate = date + item.duration * 1000
      return endDate >= clipStartAt && date <= clipEndAt
    })

    let chunks = ''

    clipMaifest.forEach((element) => {
      chunks += `#EXT-X-PROGRAM-DATE-TIME:${element.dateTimeString}
#EXTINF:${element.duration},
${element.uri}\n`
    })

    let bodyAdptativeManifest = `#EXTM3U
#EXT-X-VERSION:${parsedManifest.version}
#EXT-X-TARGETDURATION:${parsedManifest.targetDuration}
#ID3-EQUIV-TDTG:${parsedManifest.dateTimeString.toString().slice(0, 19)}
#EXT-X-PLAYLIST-TYPE:${parsedManifest.playlistType}
#EXT-X-MEDIA-SEQUENCE:${parsedManifest.mediaSequence}
#EXT-X-TWITCH-ELAPSED-SECS:${start_time}.000
#EXT-X-TWITCH-TOTAL-SECS:${end_time}.000
${chunks.trim()}
#EXT-X-ENDLIST`
    return bodyAdptativeManifest.trim()
  }

  // (4) write to S3
  await writeToS3(newMaster, 'clip_master.m3u8', location)
  // (4.1) Loop write to S3 the Adaptative Manifest
  await loopWrite(clipManifest, masterManifest, location)

  async function loopWrite(clipBody, master, local) {
    let playlists = master.playlists
    for await (const playlist of playlists) {
      let newLocation = `${local}/${playlist.attributes.VIDEO}`
      await writeToS3(clipBody, 'clip.m3u8', newLocation)
    }
  }

  async function writeToS3(body, filename, location) {
    let params = {
      Body: body,
      Bucket: location,
      Key: filename,
      ContentType: 'application/x-mpegURL'
    }
    await s3
      .putObject(params, function (err, data) {
        if (err) {
          console.log('Error uploading data: ', err)
        } else {
          resp = data
        }
      })
      .promise()
  }

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    },
    body: clipManifest
  }
  return response
}

// auxiliar functions
// HHTPS get request the URL

function getRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      res.setEncoding('utf8')
      let rawData = ''

      res.on('data', (chunk) => {
        rawData += chunk
      })

      res.on('end', () => {
        try {
          resolve(rawData)
        } catch (err) {
          reject(new Error(err))
        }
      })
    })

    req.on('error', (err) => {
      reject(new Error(err))
    })
  })
}
