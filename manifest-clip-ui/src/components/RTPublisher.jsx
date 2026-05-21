// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useRef, useState, useEffect } from 'react'
import './styles/RTPublisher.css'

export default function RTPublisher() {
  const [status, setStatus] = useState('Ready. Click "Join & Publish" to start streaming.')
  const [connected, setConnected] = useState(false)
  const [compositionArn, setCompositionArn] = useState(null)
  const [compositionActive, setCompositionActive] = useState(false)
  const videoRef = useRef(null)
  const stageRef = useRef(null)
  const streamRef = useRef(null)
  const logsRef = useRef(null)

  const [config, setConfig] = useState({
    tokenUrl: 'https://9i7ub8ef58.execute-api.us-east-1.amazonaws.com/Prod/token',
    compStartUrl: 'https://9i7ub8ef58.execute-api.us-east-1.amazonaws.com/Prod/composition/start',
    compStopUrl: 'https://9i7ub8ef58.execute-api.us-east-1.amazonaws.com/Prod/composition/stop'
  })

  function log(msg) {
    const time = new Date().toLocaleTimeString()
    setStatus(prev => `${prev}\n[${time}] ${msg}`)
    setTimeout(() => {
      if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight
    }, 50)
  }

  async function joinStage() {
    try {
      log('Requesting token...')
      const tokenUrl = config.tokenUrl
      if (!tokenUrl) {
        log('ERROR: Token URL not configured. Deploy realtime-recorder stack first.')
        return
      }

      const res = await fetch(`${tokenUrl}?userId=test-${Date.now()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Token request failed')

      log(`Token received. Participant: ${data.participantId}`)

      log('Requesting camera/mic access...')
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      log('Camera/mic ready.')

      const script = document.createElement('script')
      script.src = 'https://web-broadcast.live-video.net/1.18.0/amazon-ivs-web-broadcast.js'
      script.onload = async () => {
        const { Stage, LocalStageStream, SubscribeType, StageEvents } = window.IVSBroadcastClient

        const strategy = {
          stageStreamsToPublish() {
            return stream.getTracks().map(track => new LocalStageStream(track))
          },
          shouldPublishParticipant() { return true },
          shouldSubscribeToParticipant() { return SubscribeType.AUDIO_VIDEO }
        }

        log('Joining stage...')
        const stage = new Stage(data.token, strategy)
        stageRef.current = stage

        stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state) => {
          log(`Connection state: ${state}`)
          if (state === 'connected') {
            setConnected(true)
            log('Connected & publishing! Individual recording starts automatically.')
          }
          if (state === 'disconnected') {
            setConnected(false)
          }
        })

        stage.on(StageEvents.STAGE_PARTICIPANT_JOINED, (p) => {
          log(`Participant joined: ${p.userId || p.id}`)
        })

        stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, (p) => {
          log(`Participant left: ${p.userId || p.id}`)
        })

        await stage.join()
      }

      if (document.querySelector('script[src*="web-broadcast"]')) {
        script.onload()
      } else {
        document.head.appendChild(script)
      }
    } catch (err) {
      log(`ERROR: ${err.message}`)
    }
  }

  function leaveStage() {
    if (stageRef.current) {
      stageRef.current.leave()
      stageRef.current = null
      log('Left stage.')
    }
    setConnected(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  async function startComposition() {
    try {
      if (!config.compStartUrl) {
        log('ERROR: Composition URL not configured.')
        return
      }
      log('Starting composition...')
      const res = await fetch(config.compStartUrl, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Start composition failed')

      setCompositionArn(data.compositionArn)
      setCompositionActive(true)
      log(`Composition started: ${data.compositionArn}`)
      log(`State: ${data.state}`)
    } catch (err) {
      log(`ERROR: ${err.message}`)
    }
  }

  async function stopComposition() {
    try {
      if (!compositionArn) { log('No active composition'); return }
      log('Stopping composition...')
      const res = await fetch(config.compStopUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compositionArn })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Stop composition failed')

      log('Composition stopped.')
      setCompositionArn(null)
      setCompositionActive(false)
    } catch (err) {
      log(`ERROR: ${err.message}`)
    }
  }

  return (
    <div className='Home'>
      <div className='page-container'>
        <div className='rt-publisher-container'>
          <div className='rt-header'>
            <h2>IVS Real-Time Publisher</h2>
            <p>Publish to an IVS Real-Time stage to create recordings. Supports both individual participant and composite recording modes.</p>
          </div>

          <div className='rt-config'>
            <label>Token API</label>
            <input
              value={config.tokenUrl}
              onChange={e => setConfig(c => ({ ...c, tokenUrl: e.target.value }))}
              placeholder='https://...execute-api.../Prod/token'
            />
            <label>Composition Start</label>
            <input
              value={config.compStartUrl}
              onChange={e => setConfig(c => ({ ...c, compStartUrl: e.target.value }))}
              placeholder='https://...execute-api.../Prod/composition/start'
            />
            <label>Composition Stop</label>
            <input
              value={config.compStopUrl}
              onChange={e => setConfig(c => ({ ...c, compStopUrl: e.target.value }))}
              placeholder='https://...execute-api.../Prod/composition/stop'
            />
          </div>

          <div className='rt-actions'>
            <button
              className='rt-btn rt-btn-primary'
              onClick={joinStage}
              disabled={connected}
            >
              Join & Publish
            </button>
            <button
              className='rt-btn rt-btn-secondary'
              onClick={leaveStage}
              disabled={!connected}
            >
              Leave Stage
            </button>
            <button
              className='rt-btn rt-btn-primary'
              onClick={startComposition}
              disabled={!connected || compositionActive}
            >
              Start Composition
            </button>
            <button
              className='rt-btn rt-btn-danger'
              onClick={stopComposition}
              disabled={!compositionActive}
            >
              Stop Composition
            </button>
          </div>

          <div className='rt-video-section'>
            <video ref={videoRef} autoPlay muted playsInline className='rt-preview' />
          </div>

          <div className='rt-logs' ref={logsRef}>
            <pre>{status}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
