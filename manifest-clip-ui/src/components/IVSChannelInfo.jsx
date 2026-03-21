// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState } from 'react'
import './styles/IVSChannelInfo.css'

const IVSChannelInfo = ({ config }) => {
  const [showStreamKey, setShowStreamKey] = useState(false)
  
  if (!config || !config[0]) return null
  
  const outputs = config[0]
  const channelArn = outputs.find(item => item.OutputKey === 'IVSChannelArn')?.OutputValue
  const ingestEndpoint = outputs.find(item => item.OutputKey === 'IVSChannelIngestEndpoint')?.OutputValue
  const playbackUrl = outputs.find(item => item.OutputKey === 'IVSChannelPlaybackUrl')?.OutputValue
  const streamKey = outputs.find(item => item.OutputKey === 'IVSStreamKey')?.OutputValue
  
  if (!channelArn || !streamKey) return null
  
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      // Simple feedback - could be enhanced with toast notifications
      console.log(`${label} copied to clipboard`)
    })
  }
  
  const rtmpsUrl = ingestEndpoint ? `rtmps://${ingestEndpoint}:443/app/` : ''
  
  return (
    <div className="ivs-info-container">
      <h4 className="ivs-info-title">📺 IVS Channel Information</h4>
      
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
    </div>
  )
}

export default IVSChannelInfo
