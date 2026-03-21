// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect } from 'react'
import { useDebug } from './DebugLog'
import './styles/ClipControls.css'

const ClipControls = ({
  position = 0,
  duration = 100,
  playerRef,
  disabled = false,
  vodData,
  getClips,
  onCreateClip
}) => {
  const { addDebugLine } = useDebug()
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentValue, setCurrentValue] = useState(0)
  const [byteRange, setByteRange] = useState(true)

  useEffect(() => {
    if (!isDragging) {
      setCurrentValue(position)
    }
  }, [position, isDragging])

  const handleSliderChange = (e) => {
    const newValue = parseFloat(e.target.value)
    setCurrentValue(newValue)

    if (playerRef?.current) {
      playerRef.current.currentTime(newValue)
      addDebugLine(Date.now(), `Seeking to position: ${formatTime(newValue)}`)
    }
  }

  const handleSetStart = (e) => {
    e.preventDefault()
    if (playerRef?.current) {
      setStartTime(currentValue)
      addDebugLine(Date.now(), `Start point set: ${formatTime(currentValue)}`)

      const btn = e.target
      btn.classList.add('btn-success')
      setTimeout(() => btn.classList.remove('btn-success'), 200)
    }
  }

  const handleSetEnd = (e) => {
    e.preventDefault()
    if (playerRef?.current) {
      setEndTime(currentValue)
      addDebugLine(Date.now(), `End point set: ${formatTime(currentValue)}`)
      addDebugLine(
        Date.now(),
        `Clip duration: ${formatTime(currentValue - startTime)}`
      )
      playerRef.current.pause()
    }
  }

  const handleReset = () => {
    addDebugLine(Date.now(), 'Clip selection reset')
    setStartTime(null)
    setEndTime(null)
    if (playerRef?.current) {
      playerRef.current.currentTime(0)
      playerRef.current.play()
    }
  }

  const handleCreateClip = () => {
    return onCreateClip(startTime, endTime, byteRange)
  }

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  return (
    <div className='clip-container'>
      <div className='d-flex justify-content-between align-items-center'>
        <div className='btn-group'>
          <button
            className='btn btn-primary'
            onClick={handleSetStart}
            disabled={disabled || startTime !== null}
          >
            Set Start
          </button>
          <button
            className='btn btn-primary'
            onClick={handleSetEnd}
            disabled={disabled || startTime === null || endTime !== null}
          >
            Set End
          </button>
          {(startTime !== null || endTime !== null) && (
            <button className='btn btn-secondary' onClick={handleReset}>
              Reset
            </button>
          )}
        </div>

        <div className='time-display'>
          {formatTime(startTime)} / {formatTime(currentValue)} /{' '}
          {formatTime(endTime)}
        </div>
      </div>

      <div className='timeline-container'>
        <div className='progress-track'>
          <div
            className='progress-fill'
            style={{
              left: `${startTime ? (startTime / duration) * 100 : 0}%`,
              width: `${
                startTime
                  ? (((endTime || currentValue) - startTime) / duration) * 100
                  : (currentValue / duration) * 100
              }%`
            }}
          />
        </div>
        <input
          type='range'
          className='range-input'
          value={currentValue}
          min={0}
          max={duration}
          step={1}
          disabled={disabled}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        />
        <div className='timeline-markers'>
          {startTime !== null && (
            <>
              <div
                className='marker start'
                style={{ left: `${(startTime / duration) * 100}%` }}
              />
              <div
                className='marker-label start'
                style={{ left: `${(startTime / duration) * 100}%` }}
              >
                START
              </div>
            </>
          )}
          {endTime !== null && (
            <>
              <div
                className='marker end'
                style={{ left: `${(endTime / duration) * 100}%` }}
              />
              <div
                className='marker-label end'
                style={{ left: `${(endTime / duration) * 100}%` }}
              >
                END
              </div>
            </>
          )}
        </div>
      </div>

      {startTime !== null && endTime !== null && (
        <div className='mt-3'>
          <div className='form-check mb-2'>
            <input
              type='checkbox'
              className='form-check-input'
              id='byteRangeCheck'
              checked={byteRange}
              onChange={(e) => {
                setByteRange(e.target.checked)
                addDebugLine(
                  Date.now(),
                  `Byte range ${e.target.checked ? 'enabled' : 'disabled'}`
                )
              }}
            />
            <label className='form-check-label' htmlFor='byteRangeCheck'>
              Byte Range - Note: Byte range allows extra precision, up to
              one-second. It's only available for VODs recorded after Amazon IVS
              byte range support.
            </label>
          </div>
          <div className='text-end'>
            <button className='btn btn-success' onClick={handleCreateClip}>
              Create Clip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClipControls
