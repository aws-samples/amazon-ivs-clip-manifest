/// Author: Osmar Bento da Silva Junior - osmarb@amazon.com
'use strict'
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const m3u8Parser = require('m3u8-parser')
const url = require('url')
const s3Bucket = process.env.STORAGE_IVSRECORDINGS_BUCKETNAME

exports.handler = async (event) => {
  // (1) parse event body
  const body = JSON.parse(event.body)
  const excutionTime = Date.now()
  const masterKey = url.parse(body.master_url).pathname
  let rawMasterManifest,
    parsedMasterManifest,
    rawPlaylistManifest,
    parsedPlaylistManifest,
    pathLocation,
    s3BucketFolder,
    clippedRawPlaylistManifest,
    clippedRawMasterManifest

  // (2) get master manifest from S3
  rawMasterManifest = await getManifestFile(masterKey)

  // (3) Parse Manifest Function
  async function parseM3U8Manifest(manifest) {
    try {
      let parser = new m3u8Parser.Parser()
      parser.push(manifest)
      parser.end()
      return parser.manifest
    } catch (error) {
      console.error(error)
      return
    }
  }

  // (4) get master parsed
  parsedMasterManifest = await parseM3U8Manifest(rawMasterManifest)

  // (5) get the playlist manifest
  async function getPlaylistManifest(parsed_master) {
    try {
      const playlistURI = JSON.stringify(parsed_master.playlists[0].uri)
      const playlistURL = masterKey.replace(
        'master.m3u8',
        playlistURI.replace(/"/g, '')
      )
      const playlistManifest = await getManifestFile(playlistURL)
      return playlistManifest
    } catch (error) {
      console.error(error)
      return
    }
  }

  rawPlaylistManifest = await getPlaylistManifest(parsedMasterManifest)

  // (5) Parse the playlist manifest
  parsedPlaylistManifest = await parseM3U8Manifest(rawPlaylistManifest)

  // (6) Clip the content
  async function clipPlaylistManifest(parsed_manifest) {
    if (!parsed_manifest) return
    const startTime = body.start_time
    const endTime = body.end_time
    const streamStart =
      parsedPlaylistManifest.segments[0].dateTimeObject.getTime()
    const clipStartAt = Math.floor(startTime * 1000 + streamStart)
    const clipEndAt = Math.floor(streamStart + endTime * 1000)

    const clippedPlaylistManifest = parsed_manifest.segments.filter((item) => {
      let date = item.dateTimeObject.getTime()
      let endDate = date + item.duration * 1000
      return endDate >= clipStartAt && date <= clipEndAt
    })

    const chunks = constructChunkString(clippedPlaylistManifest)
    let bodyPlaylistManifest = `#EXTM3U
#EXT-X-VERSION:${parsed_manifest.version}
#EXT-X-TARGETDURATION:${parsed_manifest.targetDuration}
#ID3-EQUIV-TDTG:${parsed_manifest.dateTimeString.toString().slice(0, 19)}
#EXT-X-PLAYLIST-TYPE:${parsed_manifest.playlistType}
#EXT-X-MEDIA-SEQUENCE:${parsed_manifest.mediaSequence}
#EXT-X-TWITCH-ELAPSED-SECS:${startTime}.000
#EXT-X-TWITCH-TOTAL-SECS:${endTime}.000`

    return Buffer.concat([
      Buffer.from(bodyPlaylistManifest),
      ...chunks,
      Buffer.from('#EXT-X-ENDLIST')
    ])
  }

  function constructChunkString(clipped_manifest) {
    let chunks = []
    for (const segments of clipped_manifest) {
      chunks.push(
        Buffer.from(`#EXT-X-PROGRAM-DATE-TIME:${segments.dateTimeString}
#EXTINF:${segments.duration},
${segments.uri}\n`)
      )
    }
    return chunks
  }

  clippedRawPlaylistManifest = await clipPlaylistManifest(
    parsedPlaylistManifest
  )

  clippedRawMasterManifest = rawMasterManifest
    .toString()
    .replace(/playlist/g, `${excutionTime}_clip_playlist`)

  pathLocation = masterKey.replace('/master.m3u8', '')
  s3BucketFolder = s3Bucket + pathLocation

  // (7) Write to S3, the Clipped Master Manifest
  await writeToS3(
    clippedRawMasterManifest,
    `${excutionTime}_clip_master.m3u8`,
    s3BucketFolder
  )

  // (8) Write to S3 the Clipped Playlist Manifest
  const playlists = parsedMasterManifest.playlists
  for await (const playlist of playlists) {
    const newLocation = `${s3BucketFolder}/${playlist.attributes.VIDEO}`
    await writeToS3(
      clippedRawPlaylistManifest,
      `${excutionTime}_clip_playlist.m3u8`,
      newLocation
    )
  }

  async function writeToS3(body, filename, location) {
    const params = {
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
          return data
        }
      })
      .promise()
  }

  // (7) Send the response
  const responseBody = [
    {
      execution: excutionTime,
      path: pathLocation,
      bucket: s3Bucket,
      clip_master: `${s3BucketFolder}${excutionTime}_clip_master.m3u8`,
      master_url: `${process.env.CLOUDFRONT_DOMAIN_NAME}${pathLocation}/${excutionTime}_clip_master.m3u8`
    }
  ]

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    },
    body: JSON.stringify(responseBody)
  }
  return response
}

// (2.2) get master manifest from S3
async function getManifestFile(key) {
  const params = {
    Bucket: s3Bucket,
    Key: key.slice(1)
  }
  try {
    const response = await s3.getObject(params).promise()
    return response.Body.toString('ascii')
  } catch (error) {
    console.error(error)
    return
  }
}
