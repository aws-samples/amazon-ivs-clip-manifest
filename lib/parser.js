// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

'use strict'

/**
 * Parse a master manifest and extract media playlist references.
 * Matches IVS-style rendition lines like "720p30/playlist.m3u8".
 *
 * @param {string} masterManifest - Raw master manifest text
 * @returns {Array<{uri: string, base: string, filename: string}>}
 */
function parseMaster(masterManifest) {
  const playlists = []
  const regExp = /^[0-9]{1,4}p[0-9]{2}/
  for (const playlistLine of masterManifest.split('\n')) {
    const line = playlistLine.trim()
    if (regExp.test(line)) {
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
 * Parse a media playlist extracting segments with PDT timestamps.
 *
 * Bug fix #3: Instead of assuming fixed line offsets (PDT → EXTINF → byte-range → URI),
 * scans forward from each PDT tag to find EXTINF, optional BYTERANGE, and segment URI.
 *
 * Bug fix #4: Tracks #EXT-X-DISCONTINUITY markers per segment.
 *
 * @param {string} playlistText - Raw media playlist text
 * @param {boolean} byteRange - Whether to look for byte-range tags
 * @returns {{segments: Array, genericExt: Array<string>}}
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

  // Track whether we've seen a discontinuity before the next segment
  let pendingDiscontinuity = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line === '#EXT-X-DISCONTINUITY') {
      pendingDiscontinuity = true
      continue
    }

    if (!line.startsWith('#EXT-X-PROGRAM-DATE-TIME')) {
      continue
    }

    // Found a PDT tag — scan forward for EXTINF, optional BYTERANGE, and URI
    const pdt = line.substring(line.indexOf(':') + 1)
    const segment = { pdt, discontinuity: pendingDiscontinuity }
    pendingDiscontinuity = false

    for (let j = i + 1; j < lines.length && j <= i + 6; j++) {
      const next = lines[j].trim()

      if (next.startsWith('#EXTINF')) {
        segment.duration = parseFloat(next.split(':').pop())
      } else if (next.startsWith('#EXT-X-BYTERANGE') && byteRange) {
        segment.byte = next
      } else if (next !== '' && !next.startsWith('#')) {
        // First non-empty, non-tag line is the segment URI
        segment.uri = next
        break
      }
    }

    if (segment.uri && segment.duration !== undefined) {
      segments.push(segment)
    }
  }

  return { segments, genericExt }
}

module.exports = { parseMaster, parsePlaylistWithPDT }
