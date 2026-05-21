// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState } from 'react'
import './styles/IVSChannelInfo.css'

const IVSChannelInfo = ({ config }) => {
  const [showStreamKey, setShowStreamKey] = useState(false)

  if (!config || !config[0]) return null

  const outputs = config[0]
  const getOutput = (key) => outputs.find(item => item.OutputKey === key)?.OutputValue

  // Low-Latency channel info
  const channelArn = getOutput('IVSChannelArn')
  const ingestEndpoint = getOutput('IVSChannelIngestEndpoint')
  const playbackUrl = getOutput('IVSChannelPlaybackUrl')
  const streamKey = getOutput('IVSStreamKey')

  // Real-Time stage info
  const stageArn = getOutput('StageArn')
  const tokenApiUrl = getOutput('TokenApiUrl')
  const compositionStartUrl = getOutput('CompositionStartApiUrl')
  const compositionStopUrl = getOutput('CompositionStopApiUrl')

  const hasLowLatency = channelArn && streamKey
  const hasRealTime = stageArn

  if (!hasLowLatency && !hasRealTime) return null

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log(`${label} copied to clipboard`)
    })
  }

  const rtmpsUrl = ingestEndpoint ? `rtmps://${ingestEndpoint}:443/app/` : ''

  return (
    <div className="ivs-info-container">
      {hasLowLatency && (
        <>
          <h4 className="ivs-info-title">IVS Low-Latency Channel</h4>
          <div className="ivs-info-grid">
            <div className="ivs-info-item">
              <label>Server URL (for OBS):</label>
              <div className="ivs-info-value">
                <span>{rtmpsUrl}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(rtmpsUrl, 'Server URL')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="ivs-info-item">
              <label>Stream Key:</label>
              <div className="ivs-info-value">
                <span>{showStreamKey ? streamKey : '••••••••••••••••'}</span>
                <button
                  className="toggle-btn"
                  onClick={() => setShowStreamKey(!showStreamKey)}
                  title={showStreamKey ? 'Hide stream key' : 'Show stream key'}
                >
                  {showStreamKey ? '🙈' : '👁️'}
                </button>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(streamKey, 'Stream Key')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="ivs-info-item">
              <label>Playback URL:</label>
              <div className="ivs-info-value">
                <span>{playbackUrl}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(playbackUrl, 'Playback URL')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {hasRealTime && (
        <>
          <h4 className="ivs-info-title ivs-info-title-rt">IVS Real-Time Stage</h4>
          <div className="ivs-info-grid">
            <div className="ivs-info-item">
              <label>Stage ARN:</label>
              <div className="ivs-info-value">
                <span>{stageArn}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(stageArn, 'Stage ARN')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>

            {tokenApiUrl && (
              <div className="ivs-info-item">
                <label>Token API:</label>
                <div className="ivs-info-value">
                  <span>{tokenApiUrl}</span>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(tokenApiUrl, 'Token API')}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}

            {compositionStartUrl && (
              <div className="ivs-info-item">
                <label>Composition API:</label>
                <div className="ivs-info-value">
                  <span>{compositionStartUrl}</span>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(compositionStartUrl, 'Composition API')}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default IVSChannelInfo
