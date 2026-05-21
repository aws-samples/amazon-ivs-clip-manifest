// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

'use strict'

const { parsePlaylistWithPDT } = require('./parser')

/**
 * Filter playlist segments by a time range.
 *
 * Uses PDT timestamps when available (standard IVS, RT individual).
 * Falls back to offset-based clipping using cumulative segment durations
 * when no PDT is present (RT composite).
 *
 * @param {string} playlistText - Raw media playlist text
 * @param {number} startTime - Clip start in seconds (relative to stream start)
 * @param {number} endTime - Clip end in seconds (relative to stream start)
 * @param {boolean} byteRange - Whether to parse byte-range tags
 * @returns {{segments: Array, genericExt: Array<string>}}
 */
function clipPlaylistByPDT(playlistText, startTime, endTime, byteRange) {
  const { segments, genericExt } = parsePlaylistWithPDT(playlistText, byteRange)

  if (segments.length === 0) {
    throw Object.assign(
      new Error('No segments found in playlist'),
      { statusCode: 400 }
    )
  }

  let filterSegments

  if (segments[0].pdt) {
    // PDT-based clipping (standard IVS + RT individual with computed PDTs)
    const streamStart = new Date(segments[0].pdt).getTime()
    const clipStartAt = Math.floor(startTime * 1000 + streamStart)
    const clipEndAt = Math.floor(streamStart + endTime * 1000)

    filterSegments = []
    for (const segment of segments) {
      const date = new Date(segment.pdt).getTime()
      const endDate = date + segment.duration * 1000
      if (endDate >= clipStartAt && date <= clipEndAt) {
        filterSegments.push(segment)
      }
    }
  } else {
    // Offset-based clipping (RT composite — no PDT at all)
    filterSegments = []
    let offsetSec = 0
    for (const segment of segments) {
      const segEnd = offsetSec + segment.duration
      if (segEnd >= startTime && offsetSec <= endTime) {
        filterSegments.push(segment)
      }
      offsetSec = segEnd
    }
  }

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
 * Supports both standard MPEG-TS playlists and fMP4 playlists with init segments.
 * Emits #EXT-X-MAP when segments reference init segments (RT individual recordings).
 * Emits #EXT-X-DISCONTINUITY to preserve discontinuity markers.
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

  // Detect HLS version: use 7 if any segment has an init map (fMP4)
  const hasMaps = segments.some(s => s.map)
  const version = hasMaps ? 7 : 4

  let playlist = `#EXTM3U\n#EXT-X-VERSION:${version}\n`
  for (const ext of genericExt) {
    playlist += `${ext}\n`
  }
  playlist += `#EXT-X-TWITCH-TOTAL-SECS:${totalDuration.toFixed(3)}\n`

  let lastMap = null

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    if (segment.discontinuity) {
      playlist += '#EXT-X-DISCONTINUITY\n'
    }

    // Emit #EXT-X-MAP when init segment changes
    if (segment.map && segment.map !== lastMap) {
      playlist += `#EXT-X-MAP:URI="${segment.map}"\n`
      lastMap = segment.map
    }

    if (segment.pdt) {
      playlist += `#EXT-X-PROGRAM-DATE-TIME:${segment.pdt}\n`
    }

    const byteTag = segment.byte ? `${segment.byte}\n` : ''
    playlist += `#EXTINF:${segment.duration}\n${byteTag}${segment.uri}\n`
  }

  playlist += '#EXT-X-ENDLIST'
  return playlist
}

/**
 * Rewrite a master/multivariant manifest to point to clip playlists.
 *
 * Handles both standard IVS (base/filename) and RT formats where
 * base may include nested paths or hash suffixes.
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
    const original = playlist.uri
    const replacement = `${playlist.base}/${clipFilename}`
    result = result.replace(original, replacement)
  }

  return result
}

module.exports = { clipPlaylistByPDT, createPlaylistManifest, rewriteMaster }
