/// Author: Osmar Bento da Silva Junior - osmarb@amazon.com
'use strict'
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const url = require('url')
const s3Bucket = process.env.STORAGE_IVSRECORDINGS_BUCKETNAME

exports.handler = async (event) => {
  // (1) parse event body and get the start and end time of the clip
  const body = JSON.parse(event.body)
  const excutionTime = Date.now()
  const startTime = body.start_time
  const endTime = body.end_time
  const byteRange = body.byte_range
  let masterURL = url.parse(body.master_url).pathname
  const pathName = masterURL.replace('/master.m3u8', '')
  const s3BucketFolder = s3Bucket + pathName

  let genericExt = []
  // (2) request the master manifest from S3 and return the raw manifest
  const rawMasterManifest = await getManifestfromS3(
    byteRange
      ? masterURL.replace('master.m3u8', 'byte-range-multivariant.m3u8')
      : masterURL
  )

  // (3) parse the master manifest and return the media playlists
  function parseMaster(masterFile) {
    let lines = masterFile.split('\n')
    let playlists = []
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim()
      const regExp = new RegExp('^[0-9]{1,3}p[0-9]{2}')
      if (regExp.test(line)) {
        let playlist = {}
        playlist.uri = line
        playlist.base = line.split('/')[0]
        playlist.filename = line.split('/')[1]
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
  function parsePlaylistwithPDT(playlist) {
    let lines = playlist.split('\n')
    let segments = []
    // add manifest generic lines
    genericExt = lines.filter(
      (line) =>
        line.startsWith('#EXT-X-TARGETDURATION') |
        line.startsWith('#ID3-EQUIV-TDTG') |
        line.startsWith('#EXT-X-PLAYLIST-TYPE') |
        line.startsWith('#EXT-X-MEDIA-SEQUENCE') |
        line.startsWith('#EXT-X-TWITCH-ELAPSED-SECS')
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
    let playlist = `#EXTM3U\n#EXT-X-VERSION:4\n`
    let duration = 0
    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i]
      duration += segment.duration
    }
    //playlist += `#EXT-X-TARGETDURATION:${Math.ceil(duration)}\n`

    for (let i = 0; i < genericExt.length; i++) {
      playlist += `${genericExt[i]}\n`
    }
    playlist += `#EXT-X-TWITCH-TOTAL-SECS:${Math.ceil(duration)}\n`
    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i]
      if (segment.byte) {
        playlist += `#EXT-X-PROGRAM-DATE-TIME:${segment.pdt}\n#EXTINF:${segment.duration}\n${segment.byte}\n${segment.uri}\n`
      } else {
        playlist += `#EXT-X-PROGRAM-DATE-TIME:${segment.pdt}\n#EXTINF:${segment.duration}\n${segment.uri}\n`
      }
    }
    playlist += '#EXT-X-ENDLIST'
    return playlist
  }

  const newPlaylist = createPlaylistManifest(
    clipPlaylistbyPDT(rawPlaylistManifest, startTime, endTime)
  )

  // (8) write to S3 the filtered Master Manifest
  if (rawMasterManifest) {
    let fileName = new RegExp(mediaPlaylists[0].filename, 'g')
    let newMaster = rawMasterManifest
      .toString()
      .replace(fileName, `${excutionTime}_clip_playlist.m3u8`)
    await writeToS3(
      newMaster,
      `${excutionTime}_clip_master.m3u8`,
      s3BucketFolder
    )
  }

  // (9) write to S3 the filtered Media Playlist
  if (mediaPlaylists) {
    for await (const playlist of mediaPlaylists) {
      const newLocation = `${s3BucketFolder}/${playlist.base}`
      await writeToS3(
        newPlaylist,
        `${excutionTime}_clip_playlist.m3u8`,
        newLocation
      )
    }
  }

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
