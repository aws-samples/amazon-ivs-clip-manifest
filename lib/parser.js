// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

'use strict'

/**
 * Parse a master/multivariant manifest and extract media playlist references.
 *
 * Supports three formats:
 * - Standard IVS low-latency: "720p30/playlist.m3u8"
 * - RT Composite: "720p30-dEYrabTe1zca/playlist.m3u8" (after #EXT-X-STREAM-INF)
 * - RT Individual: "high/playlist.m3u8" (after #EXT-X-STREAM-INF)
 *
 * @param {string} masterManifest - Raw master/multivariant manifest text
 * @returns {Array<{uri: string, base: string, filename: string}>}
 */
function parseMaster(masterManifest) {
  const playlists = []
  const lines = masterManifest.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('#EXT-X-STREAM-INF')) {
      // Next non-empty, non-comment line is the rendition URI
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim()
        if (next !== '' && !next.startsWith('#')) {
          const parts = next.split('/')
          playlists.push({
            uri: next,
            base: parts.slice(0, -1).join('/'),
            filename: parts[parts.length - 1]
          })
          i = j
          break
        }
      }
      continue
    }

    // Fallback: legacy regex for manifests without #EXT-X-STREAM-INF prefix
    const legacyRegExp = /^[0-9]{1,4}p[0-9]{2}/
    if (legacyRegExp.test(line)) {
      playlists.push({
        uri: line,
        base: line.split('/')[0],
        filename: line.split('/')[1]
      })
    }
  }

  return playlists
}

/**
 * Parse a media playlist extracting segments with timing information.
 *
 * Supports three playlist styles:
 * - Standard IVS: PDT tag before every segment
 * - RT Individual: Single PDT at the start + #EXT-X-MAP init segments + fMP4
 * - RT Composite: No PDT at all, MPEG-TS segments with fixed duration
 *
 * For playlists without per-segment PDT, computes synthetic PDT from
 * the first PDT (or recording start) plus cumulative segment durations.
 *
 * @param {string} playlistText - Raw media playlist text
 * @param {boolean} byteRange - Whether to look for byte-range tags
 * @returns {{segments: Array, genericExt: Array<string>, initSegments: Array<string>}}
 */
function parsePlaylistWithPDT(playlistText, byteRange) {
  const lines = playlistText.split('\n')
  const segments = []

  // Capture generic playlist-level tags
  const filterConditions = [
    '#EXT-X-TARGETDURATION',
    '#ID3-EQUIV-TDTG',
    '#EXT-X-PLAYLIST-TYPE',
    '#EXT-X-MEDIA-SEQUENCE',
    '#EXT-X-TWITCH-ELAPSED-SECS',
    '#EXT-X-DISCONTINUITY-SEQUENCE'
  ]
  const genericExt = lines.filter((line) =>
    filterConditions.some((condition) => line.startsWith(condition))
  )

  // Track state while parsing
  let pendingDiscontinuity = false
  let currentMap = null // current #EXT-X-MAP URI
  let currentPdt = null // most recent PDT value
  let cumulativeTime = 0 // running time offset in ms
  let pdtCount = 0

  // First pass: collect all segments with available info
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line === '#EXT-X-DISCONTINUITY') {
      pendingDiscontinuity = true
      continue
    }

    if (line.startsWith('#EXT-X-MAP')) {
      const match = line.match(/URI="([^"]+)"/)
      if (match) currentMap = match[1]
      continue
    }

    if (line.startsWith('#EXT-X-PROGRAM-DATE-TIME')) {
      currentPdt = line.substring(line.indexOf(':') + 1)
      pdtCount++
      continue
    }

    if (!line.startsWith('#EXTINF')) {
      continue
    }

    // Found EXTINF — parse duration and scan for byte-range + URI
    const duration = parseFloat(line.split(':').pop())
    const segment = { discontinuity: pendingDiscontinuity }
    pendingDiscontinuity = false

    if (currentMap) {
      segment.map = currentMap
    }

    segment.duration = duration

    // Assign PDT: use current if available, otherwise compute from cumulative offset
    if (currentPdt) {
      segment.pdt = currentPdt
      currentPdt = null // consumed
    }

    // Scan forward for optional BYTERANGE and segment URI
    for (let j = i + 1; j < lines.length && j <= i + 4; j++) {
      const next = lines[j].trim()

      if (next.startsWith('#EXT-X-BYTERANGE') && byteRange) {
        segment.byte = next
      } else if (next !== '' && !next.startsWith('#')) {
        segment.uri = next
        i = j
        break
      }
    }

    if (segment.uri && segment.duration !== undefined) {
      segments.push(segment)
    }
  }

  // Second pass: ensure all segments have PDT (compute from first PDT + cumulative duration)
  if (segments.length > 0) {
    let basePdt = segments[0].pdt
      ? new Date(segments[0].pdt).getTime()
      : null

    let runningMs = 0
    for (const segment of segments) {
      if (!segment.pdt && basePdt !== null) {
        segment.pdt = new Date(basePdt + runningMs).toISOString()
      } else if (segment.pdt && basePdt === null) {
        basePdt = new Date(segment.pdt).getTime()
        runningMs = 0
      }
      runningMs += segment.duration * 1000
    }
  }

  return { segments, genericExt }
}

module.exports = { parseMaster, parsePlaylistWithPDT }
