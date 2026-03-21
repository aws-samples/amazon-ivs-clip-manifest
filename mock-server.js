#!/usr/bin/env node

// Mock API server for local development without AWS
// Serves the same endpoints as the SAM-deployed Lambda functions
// Usage: node mock-server.js (or npm run mock / npm run dev:mock)

const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3001
const MOCK_CF = `http://localhost:${PORT}`

app.use(cors())
app.use(express.json())

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------
const clips = [] // clips created via POST /clipmanifest

const RECORDINGS = [
  {
    channel: 'AbCdEfGhIjKl',
    year: '2024', month: '01', day: '15', hour: '10', minute: '30',
    recording: 'Pd8MyZnzUAFl',
    assetID: 'Channel: AbCdEfGhIjKl - Date: 2024-01-15 10:30 - ID: Pd8MyZnzUAFl',
    path: 'ivs/v1/123456789012/AbCdEfGhIjKl/2024/01/15/10/30/Pd8MyZnzUAFl',
    master: `${MOCK_CF}/mock/master.m3u8`
  },
  {
    channel: 'XyZaBcDeFgHi',
    year: '2024', month: '03', day: '22', hour: '14', minute: '00',
    recording: 'Qr9StUvWxYz0',
    assetID: 'Channel: XyZaBcDeFgHi - Date: 2024-03-22 14:00 - ID: Qr9StUvWxYz0',
    path: 'ivs/v1/123456789012/XyZaBcDeFgHi/2024/03/22/14/00/Qr9StUvWxYz0',
    master: `${MOCK_CF}/mock/master.m3u8`
  }
]

// ---------------------------------------------------------------------------
// API endpoints (match Lambda response shapes)
// ---------------------------------------------------------------------------

// GET /getrecordings/ — list available recordings
app.get('/getrecordings/', (req, res) => {
  console.log('[mock] GET /getrecordings/')
  res.json(RECORDINGS)
})

// GET /getclips/ — list clips for a recording
app.get('/getclips/', (req, res) => {
  const vod = req.query.vod
  console.log(`[mock] GET /getclips/ vod=${vod}`)

  if (!vod) {
    return res.status(400).json({ error: 'Missing required query parameter: vod' })
  }

  const filtered = clips.filter(c => c.path === vod)
  res.json(filtered)
})

// POST /clipmanifest/ — create a clip
app.post('/clipmanifest/', (req, res) => {
  const { start_time, end_time, master_url, byte_range } = req.body
  console.log(`[mock] POST /clipmanifest/ start=${start_time} end=${end_time} byteRange=${byte_range}`)

  // Validate (mirrors Lambda validation)
  if (!start_time || !end_time || !master_url || typeof byte_range !== 'boolean') {
    return res.status(400).json({
      error: 'start_time, end_time, master_url, and byte_range are required.'
    })
  }
  if (isNaN(start_time) || isNaN(end_time)) {
    return res.status(400).json({ error: 'start_time and end_time must be numbers.' })
  }
  if (end_time <= start_time) {
    return res.status(400).json({ error: 'end_time must be greater than start_time.' })
  }

  // Derive path from master_url the same way the real Lambda does
  const execution = Date.now()
  // Find which recording this master_url belongs to
  const recording = RECORDINGS.find(r => r.master === master_url) || RECORDINGS[0]
  const pathName = recording.path

  const clip = {
    channel: recording.channel,
    year: recording.year,
    month: recording.month,
    day: recording.day,
    hour: recording.hour,
    minute: recording.minute,
    recording: recording.recording,
    assetID: recording.assetID,
    path: pathName,
    master: `${MOCK_CF}/mock/master.m3u8`,
    execution: `${execution}_clip_master.m3u8`
  }
  clips.push(clip)

  // Response matches Lambda shape
  const responseBody = [{
    execution,
    path: pathName,
    bucket: 'mock-bucket',
    clip_master: `${pathName}/${execution}_clip_master.m3u8`,
    master_url: `${MOCK_CF}/${pathName}/${execution}_clip_master.m3u8`
  }]

  res.json(responseBody)
})

// ---------------------------------------------------------------------------
// Mock HLS endpoints (minimal valid manifests for video.js to initialize)
// ---------------------------------------------------------------------------

// Master manifest — points to a single 720p rendition
app.get('/mock/master.m3u8', (req, res) => {
  res.set('Content-Type', 'application/vnd.apple.mpegurl')
  res.send([
    '#EXTM3U',
    '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720',
    `${MOCK_CF}/mock/playlist.m3u8`
  ].join('\n') + '\n')
})

// Media playlist — 10 segments of 6s each, with PDT tags
app.get('/mock/playlist.m3u8', (req, res) => {
  const baseTime = new Date('2024-01-15T10:30:00.000Z')
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '#EXT-X-TARGETDURATION:6',
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXT-X-PLAYLIST-TYPE:VOD'
  ]

  for (let i = 0; i < 10; i++) {
    const pdt = new Date(baseTime.getTime() + i * 6000).toISOString()
    lines.push(`#EXT-X-PROGRAM-DATE-TIME:${pdt}`)
    lines.push('#EXTINF:6.000,')
    lines.push(`${MOCK_CF}/mock/segment/${i}.ts`)
  }

  lines.push('#EXT-X-ENDLIST')
  res.set('Content-Type', 'application/vnd.apple.mpegurl')
  res.send(lines.join('\n') + '\n')
})

// Also serve playlist for clip URLs (any path ending in .m3u8)
app.get('/ivs/*', (req, res) => {
  if (req.path.endsWith('_clip_master.m3u8')) {
    // Redirect clip master to mock master
    res.set('Content-Type', 'application/vnd.apple.mpegurl')
    res.send([
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720',
      `${MOCK_CF}/mock/playlist.m3u8`
    ].join('\n') + '\n')
  } else {
    res.status(404).send('Not found')
  }
})

// Minimal valid MPEG-TS segment (188 bytes null packet)
// This is enough for video.js to initialize without errors
const NULL_TS_PACKET = Buffer.alloc(188)
NULL_TS_PACKET[0] = 0x47 // sync byte
NULL_TS_PACKET[1] = 0x1F // PID 0x1FFF (null packet)
NULL_TS_PACKET[2] = 0xFF
NULL_TS_PACKET[3] = 0x10 // adaptation field control

app.get('/mock/segment/:id.ts', (req, res) => {
  res.set('Content-Type', 'video/mp2t')
  // Send a few null packets to make the segment more realistic
  res.send(Buffer.concat([NULL_TS_PACKET, NULL_TS_PACKET, NULL_TS_PACKET]))
})

// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n  Mock API server running on ${MOCK_CF}`)
  console.log('  Endpoints:')
  console.log(`    GET  ${MOCK_CF}/getrecordings/`)
  console.log(`    GET  ${MOCK_CF}/getclips/?vod=<path>`)
  console.log(`    POST ${MOCK_CF}/clipmanifest/`)
  console.log(`    GET  ${MOCK_CF}/mock/master.m3u8`)
  console.log('')
})
