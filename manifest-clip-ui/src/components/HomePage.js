// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useRef, useEffect, useState } from 'react'
import './styles/HomePage.style.css'
import VideoPlayer from './player/playerJS'
import ClipPoster from './../img/clipposter.svg'
import VODPoster from './../img/vodposter.svg'
import { getClipsAPI } from './apis/getClips'
import { createClipAPI } from './apis/createClip'
import { getRecordingsAPI } from './apis/getRecordings'

export default function HomePage(props) {
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const playerRef = useRef(null)
  const [vodData, setvodData] = useState({ url: '', path: '' })
  const [listofRec, setListofRec] = useState([])
  const [listofClips, setListofClips] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [clipControls, setClipControls] = useState({
    startTime: null,
    endTime: null,
    byteRange: false
  })
  const [playClip, setPlayingClip] = useState(false)

  useEffect(() => {
    if (!vodData.url) handleRecodingData()

    if (loaded) {
      let curPlayer = document.querySelector('video')
      curPlayer.addEventListener('canplay', () => {
        curPlayer.addEventListener('timeupdate', () => {
          setPosition(playerRef.current.currentTime())
        })
      })
      return () => {
        curPlayer.removeEventListener('timeupdate', () => {
          setPosition(playerRef.current.currentTime())
        })
      }
    }
  }, [loaded])

  const addDebugLine = (metadataTime, metadataText) => {
    const domString = `
          <span className="debug-data__time">${metadataTime}</span>
          <span className="debug-data__value">${metadataText}</span>`.trim()

    const dataLine = document.createElement('div')
    dataLine.classList.add('className', 'data-line')
    dataLine.innerHTML = domString

    const debugData = document.querySelector('.debug-data')
    debugData.appendChild(dataLine)
  }

  const videoJsOptions = {
    autoplay: 'muted', //mute audio when page loads, but auto play video
    controls: true,
    responsive: true,
    fluid: true,
    width: 896,
    height: 504,
    playbackRates: [0.5, 1, 1.5, 2, 4, 8],
    sources: [
      {
        src: vodData.url,
        type: 'application/x-mpegURL'
      }
    ]
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  const handleRecodingData = async () => {
    await getRecordingsAPI().then((items) => {
      setListofRec(items)
      setvodData({
        url: items[0].master,
        path: items[0].path
      })
      getClips(items[0].path)
    })
  }

  const getClips = async (voddata) => {
    console.log('vodData')
    await getClipsAPI(voddata).then((items) => {
      setListofClips(items)
    })
  }

  const handlePlayerReady = (player) => {
    if (loaded === false) {
      console.log('setting value!!!!!!')
      setLoaded(true)
    }

    player.on('waiting', () => {
      console.log('player is waiting')
    })

    player.on('dispose', () => {
      console.log('player will dispose')
    })

    player.on('playing', () => {
      console.log('player is playing')
      addDebugLine(Date.now(), ': Player playing')
      console.log('Video Duration!', player.duration())
      setDuration(player.duration().toFixed(0))
    })

    player.on('error', (err) => {
      console.log('Play Error', err)
      addDebugLine(Date.now(), `: Player ${err.type} ${err.target.innerText}`)
    })

    player.on('pause', () => {
      console.log('Paused')
    })

    playerRef.current = player
  }

  const handleSliderSeekChangeStart = (newPosition) => {
    console.log('New position', newPosition.target.value)
    if (newPosition.target.value) {
      setClipControls({ startTime: newPosition })
      playerRef.current.currentTime(newPosition.target.value)
    }
  }

  const handleSliderSeekChangeEnd = (newPosition) => {
    console.log('New position', newPosition.target.value)
    if (newPosition.target.value) {
      setClipControls({ startTime: newPosition })
      playerRef.current.currentTime(newPosition.target.value)
    }
  }

  const handleSetStartTime = async (e) => {
    e.preventDefault()
    playerRef.current.pause()
    console.log(position)
    setClipControls({ startTime: position })
    addDebugLine(Date.now(), `: Start time set to ${position}`)
    await sleep(2000)
    playerRef.current.play()
  }

  const handleSetEndTime = (e) => {
    e.preventDefault()
    playerRef.current.pause()
    addDebugLine(Date.now(), `: End time set to ${position}`)
    setClipControls({
      startTime: clipControls.startTime,
      endTime: position
    })
    console.log(clipControls)
  }

  const handleVODChange = (event) => {
    event.preventDefault()
    setPlayingClip(false)
    setvodData({
      url: event.target.value,
      path: event.target.options[event.target.selectedIndex].getAttribute(
        'data-path'
      )
    })
    let newSrc = { src: event.target.value, type: 'application/x-mpegURL' }
    playerRef.current.src(newSrc)
    getClips(
      event.target.options[event.target.selectedIndex].getAttribute('data-path')
    )
    setClipControls({ ...clipControls, startTime: null, endTime: null })
    playerRef.current.currentTime(0)
  }

  const handlePlayClip = (event) => {
    console.log(event)
    setPlayingClip(true)
    setvodData({ url: event })
    let newSrc = { src: event, type: 'application/x-mpegURL' }
    playerRef.current.src(newSrc)
  }

  const eraseClipStartEnd = () => {
    setClipControls({ ...clipControls, startTime: null, endTime: null })
    playerRef.current.currentTime(0)
    playerRef.current.play()
  }

  const createClip = async () => {
    if (clipControls.startTime === null || clipControls.endTime === null) {
      addDebugLine(
        Date.now(),
        `: Create Clip Error: Please select a start and end time`
      )
      alert('Please select a start and end time')
      return
    }
    if (clipControls.startTime > clipControls.endTime) {
      alert('Start time must be less than end time')
      addDebugLine(
        Date.now(),
        `: Create Clip Error: Start time must be less than end time`
      )
      return
    }
    if (
      clipControls.byteRange === null ||
      clipControls.byteRange === undefined
    ) {
      console.log('byteRange is null or undefined')
      setClipControls({
        ...clipControls,
        byteRange: false
      })
    }
    await createClipAPI(
      clipControls.startTime,
      clipControls.endTime,
      vodData.url,
      clipControls.byteRange
    ).then((response) => {
      console.log('Response', response)
      addDebugLine(
        Date.now(),
        `: Create Clip Success: New clip created at ${JSON.stringify(response)}`
      )
    })
    getClips(vodData.path)
  }

  return (
    <div className='Home'>
      <div className='page-container'>
        <div className='selector-container '>
          <form>
            <div className='row'>
              <div className='col-xl'>
                <div className='form-group'>
                  <select
                    value={vodData.url}
                    className='custom-select large'
                    required
                    onChange={handleVODChange}
                  >
                    {listofRec.map((items, index) => (
                      <option
                        key={index}
                        value={items.master}
                        data-path={items.path}
                      >
                        {' '}
                        Select the VOD: {items.assetID}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className='video-container'>
          {vodData.url ? (
            <VideoPlayer
              className='video-player'
              options={videoJsOptions}
              onReady={handlePlayerReady}
              ref={playerRef}
            />
          ) : (
            <div className='video-player-placeholder'>
              <img className='card-img-top' src={VODPoster} alt='Poster' />
            </div>
          )}
        </div>
        <div className='controls-container'>
          Clip Controls {position}
          <form>
            <div className='form-group'>
              <div className='row row-center'>
                <div className='col col-small'>
                  <button
                    className='btn btn-primary control-btn'
                    onClick={(e) => handleSetStartTime(e)}
                    disabled={playClip}
                  >
                    Set Start
                  </button>
                </div>
                <div className='col-large'>
                  <input
                    type='range'
                    id='start'
                    value={
                      clipControls.startTime ? clipControls.startTime : position
                    }
                    className='form-control-range control-set'
                    max={duration}
                    disabled={playClip}
                    onChange={(e) => handleSliderSeekChangeStart(e)}
                    onClick={(e) => handleSetStartTime(e)}
                  />
                </div>
                <div className='col col-small'>
                  <input
                    type='text'
                    className='form-control clip-control'
                    id='formGroupExampleInput2'
                    value={clipControls.startTime ? clipControls.startTime : 0}
                    disabled={true}
                    //onChange={(e) => handleInputChangeStart(e)}
                  />
                </div>
              </div>
            </div>
            <div className='form-group'>
              <div className='row row-center'>
                <div className='col col-small'>
                  <button
                    className='btn btn-primary control-btn'
                    onClick={(e) => handleSetEndTime(e)}
                    disabled={playClip}
                  >
                    Set Stop
                  </button>
                </div>
                <div className='col-large'>
                  <input
                    type='range'
                    id='end'
                    value={
                      clipControls.endTime ? clipControls.endTime : position
                    }
                    max={duration}
                    disabled={playClip}
                    className='form-control-range control-set'
                    onChange={(e) => handleSliderSeekChangeEnd(e)}
                    onClick={(e) => handleSetEndTime(e)}
                  />
                </div>
                <div className='col col-small'>
                  <input
                    type='text'
                    className='form-control clip-control'
                    id='formGroupExampleInput2'
                    value={clipControls.endTime ? clipControls.endTime : 0}
                    disabled={true}
                    //onChange={(e) => handleInputChangeEnd(e)}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className='createclip-container'>
          {clipControls.startTime && clipControls.endTime ? (
            <div class='toast-body'>
              Clips attributes has been defined, Start {clipControls.startTime},
              End {clipControls.endTime}, click create clip or close.
              <div class='mt-2 pt-2 border-top'>
                <button
                  type='button'
                  className='btn btn-primary control-btn'
                  onClick={(e) => createClip(e)}
                >
                  Create Clip
                </button>
                <button
                  type='button'
                  className='btn btn-secondary control-btn'
                  onClick={() => eraseClipStartEnd()}
                >
                  Close
                </button>
                <div class='form-check'>
                  <input
                    type='checkbox'
                    class='form-check-input'
                    id='exampleCheck1'
                    onChange={(e) =>
                      setClipControls({
                        ...clipControls,
                        byteRange: e.target.checked
                      })
                    }
                  />
                  <label class='form-check-label'>
                    Byte Range? Note: Byte range allows extra precision, up to
                    one-second. It's only avaliable for VODs recorded after
                    Amazon IVS byte range support.
                  </label>
                </div>
              </div>
              <hr className='solid'></hr>
            </div>
          ) : (
            <></>
          )}
        </div>
        <div className='clips-container'>
          <div className='clips-inline'>
            {listofClips.map((items, index) => (
              <div
                className='card col-sm-2'
                key={index}
                onClick={() => handlePlayClip(items.master)}
              >
                <img
                  className='card-img-top'
                  src={ClipPoster}
                  alt={items.assetID}
                  maxwidth='200'
                  maxheight='150'
                />
                <div className='card-body'>
                  <p className='card-text card-overflow'>
                    ID: {items.execution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='debug-container'>
          <div className='debug-data'> Debug data:</div>
        </div>
      </div>
    </div>
  )
}
