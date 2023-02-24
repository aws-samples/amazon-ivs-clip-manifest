/// Author: Osmar Bento da Silva Junior - osmarb@amazon.com
'use strict'
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const url = require('url')
const s3Bucket = process.env.STORAGE_IVSRECORDINGS_BUCKETNAME

exports.handler = async (event) => {
  // (1) parse event body and get the start and end time of the clip
  let startTime, endTime, urlMaster, byteRange
  try {
    ;({
      start_time: startTime,
      end_time: endTime,
      master_url: urlMaster,
      byte_range: byteRange
    } = JSON.parse(event.body))
  } catch (error) {
    console.log(error)
    throw Object.assign(
      new Error(
        `JSON parse error ${error}, please check the API documentation`
      ),
      { statusCode: 400 }
    )
  }

  // validate input fields
  validateRequiredFields({ startTime, endTime, urlMaster, byteRange })
  validateEndTime({ startTime, endTime })
  validateNumericFields({ startTime, endTime })

  const executionTime = Date.now()
  const masterURL = url.parse(urlMaster).pathname
  const pathName = masterURL.replace('/master.m3u8', '')
  const s3BucketFolder = s3Bucket + pathName
  const excutionTime = Date.now()

  // validation functions
  function validateRequiredFields({
    startTime,
    endTime,
    urlMaster,
    byteRange
  }) {
    if (
      !startTime ||
      !endTime ||
      !urlMaster ||
      byteRange === undefined ||
      byteRange === null ||
      typeof byteRange !== 'boolean'
    ) {
      throw Object.assign(
        new Error(
          'start_time, end_time, master_url, and byte_range are required.'
        ),
        { statusCode: 400 }
      )
    }
  }

  function validateEndTime({ startTime, endTime }) {
    if (endTime <= startTime || endTime === 0) {
      throw Object.assign(
        new Error('end_time must be greater than start_time.'),
        {
          statusCode: 400
        }
      )
    }
  }

  function validateNumericFields({ startTime, endTime }) {
    if (isNaN(startTime) || isNaN(endTime)) {
      throw Object.assign(
        new Error('start_time and end_time must be numbers.'),
        {
          statusCode: 400
        }
      )
    }
  }

  // (2) request the master manifest from S3 and return the raw manifest
  const rawMasterManifest = await getManifestfromS3(
    byteRange
      ? masterURL.replace('master.m3u8', 'byte-range-multivariant.m3u8')
      : masterURL
  )

  validateByteRange(rawMasterManifest, byteRange)

  function validateByteRange(rawMasterManifest, byteRange) {
    if (rawMasterManifest === 404 && byteRange === true) {
      throw Object.assign(
        new Error('This stream does not support byte range manifest'),
        { statusCode: 404 }
      )
    }
    return null
  }

  // (3) parse the master manifest and return the media playlists
  function parseMaster(masterManifest) {
    const playlists = []
    const regExp = /^[0-9]{1,3}p[0-9]{2}/
    for (const playlistLine of masterManifest.split('\n')) {
      const line = playlistLine.trim()
      if (regExp.test(line)) {
        const playlist = {
          uri: line,
          base: line.split('/')[0],
          filename: line.split('/')[1]
        }
        playlists.push(playlist)
      }
    }
    return playlists
  }
  // (4) request the playlist manifest from S3 and return the raw playslist manifest
  async function getPlaylistManifest(playlists) {
    let playlistURL = `${pathName}/${playlists[0].uri}`
    try {
      const playlistManifest = await getManifestfromS3(playlistURL)
      return playlistManifest
    } catch (error) {
      console.error(error)
      return
    }
  }

  const mediaPlaylists = parseMaster(rawMasterManifest)
  const rawPlaylistManifest = await getPlaylistManifest(mediaPlaylists)

  // (5) parse the playlist manifest and return the segments
  let genericExt = []
  function parsePlaylistwithPDT(playlist) {
    let lines = playlist.split('\n')
    let segments = []
    // add manifest generic lines
    const filterConditions = [
      '#EXT-X-TARGETDURATION',
      '#ID3-EQUIV-TDTG',
      '#EXT-X-PLAYLIST-TYPE',
      '#EXT-X-MEDIA-SEQUENCE',
      '#EXT-X-TWITCH-ELAPSED-SECS'
    ]
    genericExt = lines.filter((line) =>
      filterConditions.some((condition) => line.startsWith(condition))
    )
    // add the media playlist files
    for (let i = 0; i < lines.length; i++) {
      let segment = {}
      let line = lines[i].trim()
      if (line.startsWith('#EXT-X-PROGRAM-DATE-TIME')) {
        let PDTinfo = line.substr(line.indexOf(':') + 1)
        if (byteRange) {
          segment.byte = lines[i + 2]
          segment.uri = lines[i + 3]
        } else {
          segment.uri = lines[i + 2]
        }
        segment.pdt = PDTinfo
        segment.duration = parseFloat(lines[i + 1].split(':').pop())
        segments.push(segment)
      }
    }
    return segments
  }

  // (6) filter the segments by the start and end time of the clip
  function clipPlaylistbyPDT(playlist, start, end) {
    let segments = parsePlaylistwithPDT(playlist)
    let filterSegments = []
    let streamStart = new Date(segments[0].pdt).getTime()
    let clipStartAt = Math.floor(start * 1000 + streamStart)
    let clipEndAt = Math.floor(streamStart + end * 1000)
    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i]
      let segmentPDT = new Date(segment.pdt)
      let date = segmentPDT.getTime()
      let endDate = date + segment.duration * 1000
      if (endDate >= clipStartAt && date <= clipEndAt) {
        filterSegments.push(segment)
      }
    }
    return filterSegments
  }

  // (7) create the playlist manifest for the clip
  function createPlaylistManifest(segments) {
    const totalDuration = segments.reduce(
      (total, segment) => total + segment.duration,
      0
    )
    let playlist = `#EXTM3U\n#EXT-X-VERSION:4\n`
    for (let i = 0; i < genericExt.length; i++) {
      playlist += `${genericExt[i]}\n`
    }
    playlist += `#EXT-X-TWITCH-TOTAL-SECS:${totalDuration.toFixed(3)}\n`
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const byteTag = segment.byte ? `${segment.byte}\n` : ''
      playlist += `#EXT-X-PROGRAM-DATE-TIME:${segment.pdt}\n#EXTINF:${segment.duration}\n${byteTag}${segment.uri}\n`
    }
    playlist += '#EXT-X-ENDLIST'
    return playlist
  }

  const newPlaylist = createPlaylistManifest(
    clipPlaylistbyPDT(rawPlaylistManifest, startTime, endTime)
  )

  // (8) write to S3 the filtered Master Manifest
  let writePromises = []

  // (8) write to S3 the filtered Master Manifest
  if (rawMasterManifest) {
    let fileName = new RegExp(mediaPlaylists[0].filename, 'g')
    let newMaster = rawMasterManifest
      .toString()
      .replace(fileName, `${excutionTime}_clip_playlist.m3u8`)
    const masterWritePromise = writeToS3(
      newMaster,
      `${excutionTime}_clip_master.m3u8`,
      s3BucketFolder
    )
    writePromises.push(masterWritePromise)
  }

  // (9) write to S3 the filtered Media Playlist
  if (mediaPlaylists) {
    for (const playlist of mediaPlaylists) {
      const newLocation = `${s3BucketFolder}/${playlist.base}`
      const playlistWritePromise = writeToS3(
        newPlaylist,
        `${excutionTime}_clip_playlist.m3u8`,
        newLocation
      )
      writePromises.push(playlistWritePromise)
    }
  }

  await Promise.all(writePromises)

  // (10) return the response
  const responseBody = [
    {
      execution: excutionTime,
      path: pathName,
      bucket: s3Bucket,
      clip_master: `${s3BucketFolder}/${excutionTime}_clip_master.m3u8`,
      master_url: `${process.env.CLOUDFRONT_DOMAIN_NAME}${pathName}/${excutionTime}_clip_master.m3u8`
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

// (aux 1) get master manifest from S3
async function getManifestfromS3(key) {
  const params = {
    Bucket: s3Bucket,
    Key: key.slice(1)
  }
  try {
    const response = await s3.getObject(params).promise()
    return response.Body.toString('ascii')
  } catch (error) {
    if (error.statusCode === 404) {
      return 404
    }
    console.error(error)
    throw error
  }
}

// (aux 2) get master manifest from S3
async function writeToS3(body, filename, location) {
  const params = {
    Body: body,
    Bucket: location,
    Key: filename,
    ContentType: 'application/x-mpegURL'
  }
  try {
    const data = await s3.putObject(params).promise()
    return data
  } catch (error) {
    console.error(`Error uploading data to S3: ${err.message}`)
    throw error
  }
}
