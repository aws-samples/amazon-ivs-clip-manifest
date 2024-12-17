import React, { useRef, useEffect, useState } from 'react'
import VideoPlayer from '../player/playerJS'
import './ClipPlayerModal.css'

const ClipPlayerModal = ({
  isOpen,
  onClose,
  clipUrl,
  clipId,
  clipData,
  addDebugLine
}) => {
  const playerRef = useRef(null)
  const [duration, setDuration] = useState('--:--')

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: clipUrl,
        type: 'application/x-mpegURL'
      }
    ]
  }

  const handlePlayerReady = (player) => {
    playerRef.current = player

    if (isOpen && player) {
      addDebugLine(Date.now(), `Clip player ready: ${clipId}`)

      player.on('loadedmetadata', () => {
        const videoDuration = player.duration()
        setDuration(formatDuration(videoDuration))
        addDebugLine(
          Date.now(),
          `Clip duration loaded: ${formatDuration(videoDuration)}`
        )
      })

      player.on('error', (err) => {
        addDebugLine(
          Date.now(),
          `Clip player error: ${err.type} ${err.message || ''}`
        )
      })
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const formatTimestamp = (data) => {
    if (!data) return ''
    return `${data.year}-${data.month}-${data.day} ${data.hour}:${data.minute}`
  }

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose()
          playerRef.current = null
        } catch (err) {
          console.error('Error disposing player:', err)
        }
      }
    }
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <div className='modal-header-content'>
            <div className='modal-title-row'>
              <h5 className='modal-title'>Clip ID: {clipId}</h5>
              <button
                type='button'
                className='btn-close'
                onClick={onClose}
                aria-label='Close'
              />
            </div>
            {clipData && (
              <div className='modal-info-row'>
                <div className='info-item'>
                  <span className='info-label'>Duration:</span>
                  <span className='info-value'>{duration}</span>
                </div>
                <div className='info-item'>
                  <span className='info-label'>Created:</span>
                  <span className='info-value'>
                    {formatTimestamp(clipData)}
                  </span>
                </div>
                <div className='info-item'>
                  <span className='info-label'>Location:</span>
                  <span className='info-value'>{clipData.master}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className='modal-body'>
          <VideoPlayer options={videoJsOptions} onReady={handlePlayerReady} />
        </div>
      </div>
    </div>
  )
}

export default ClipPlayerModal
