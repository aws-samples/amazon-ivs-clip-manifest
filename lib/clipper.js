// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

'use strict'

const { parsePlaylistWithPDT } = require('./parser')

/**
 * Filter playlist segments by a time range using PDT timestamps.
 *
 * Bug fix #2: Guards against empty segments array.
 * Bug fix #5: Throws if no segments match the requested time range.
 *
 * @param {string} playlistText - Raw media playlist text
 * @param {number} startTime - Clip start in seconds (relative to stream start)
 * @param {number} endTime - Clip end in seconds (relative to stream start)
 * @param {boolean} byteRange - Whether to parse byte-range tags
 * @returns {{segments: Array, genericExt: Array<string>}}
 */
function clipPlaylistByPDT(playlistText, startTime, endTime, byteRange) {
  const { segments, genericExt } = parsePlaylistWithPDT(playlistText, byteRange)

  // Bug fix #2: crash on empty segments
  if (segments.length === 0) {
    throw Object.assign(
      new Error('No segments with PDT tags found in playlist'),
      { statusCode: 400 }
    )
  }

  const streamStart = new Date(segments[0].pdt).getTime()
  const clipStartAt = Math.floor(startTime * 1000 + streamStart)
  const clipEndAt = Math.floor(streamStart + endTime * 1000)

  const filterSegments = []
  for (const segment of segments) {
    const date = new Date(segment.pdt).getTime()
    const endDate = date + segment.duration * 1000
    if (endDate >= clipStartAt && date <= clipEndAt) {
      filterSegments.push(segment)
    }
  }

  // Bug fix #5: empty clip result
  if (filterSegments.length === 0) {
    throw Object.assign(
      new Error('No segments found in the requested time range'),
      { statusCode: 400 }
    )
  }

  return { segments: filterSegments, genericExt }
}

/**
 * Generate a new HLS media playlist manifest from filtered segments.
 *
 * Bug fix #4: Emits #EXT-X-DISCONTINUITY before segments that had it in the original.
 *
 * @param {Array} segments - Filtered segments from clipPlaylistByPDT
 * @param {Array<string>} genericExt - Playlist-level tags to preserve
 * @returns {string} Valid HLS media playlist
 */
function createPlaylistManifest(segments, genericExt) {
  const totalDuration = segments.reduce(
    (total, segment) => total + segment.duration,
    0
  )
  let playlist = '#EXTM3U\n#EXT-X-VERSION:4\n'
  for (const ext of genericExt) {
    playlist += `${ext}\n`
  }
  playlist += `#EXT-X-TWITCH-TOTAL-SECS:${totalDuration.toFixed(3)}\n`

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    // Bug fix #4: preserve discontinuity markers
    if (segment.discontinuity) {
      playlist += '#EXT-X-DISCONTINUITY\n'
    }
    const byteTag = segment.byte ? `${segment.byte}\n` : ''
    playlist += `#EXT-X-PROGRAM-DATE-TIME:${segment.pdt}\n#EXTINF:${segment.duration}\n${byteTag}${segment.uri}\n`
  }

  playlist += '#EXT-X-ENDLIST'
  return playlist
}

/**
 * Rewrite a master manifest to point to clip playlists.
 *
 * Bug fix #1: Replaces each rendition's filename individually instead of
 * using a global regex on the first rendition's filename.
 *
 * @param {string} masterText - Raw master manifest text
 * @param {Array<{uri: string, base: string, filename: string}>} playlists - Parsed renditions
 * @param {number} executionTime - Timestamp for clip filenames
 * @returns {string} Rewritten master manifest
 */
function rewriteMaster(masterText, playlists, executionTime) {
  let result = masterText.toString()
  const clipFilename = `${executionTime}_clip_playlist.m3u8`

  for (const playlist of playlists) {
    // Replace each rendition's filename individually
    const original = `${playlist.base}/${playlist.filename}`
    const replacement = `${playlist.base}/${clipFilename}`
    result = result.replace(original, replacement)
  }

  return result
}

module.exports = { clipPlaylistByPDT, createPlaylistManifest, rewriteMaster }
