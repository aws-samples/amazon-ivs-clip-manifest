import React, { useRef, useEffect, useState, useCallback } from 'react'
import './styles/HomePage.style.css'
import VideoPlayer from './player/playerJS'
import ClipPoster from './../img/clipposter.svg'
import { getClipsAPI } from './apis/getClips'
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
    endTime: null
  })

  useEffect(() => {
    if (!vodData.url) handleRecodingData()
  }, [])

  useEffect(() => {
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
      addDebugLine(Date.now(), 'Player playing')
      console.log('Video Duration!', player.duration())
      setDuration(player.duration().toFixed(0))
    })

    player.on('error', (err) => {
      console.log('Play Error', err)
      addDebugLine(Date.now(), `Player ${err.type} ${err.target.innerText}`)
    })

    player.on('pause', () => {
      console.log('Paused')
    })

    playerRef.current = player
  }

  const handleSliderSeekChangeStart = (newPosition) => {
    console.log(newPosition.target.value)
    playerRef.current.currentTime(newPosition.target.value)
    setClipControls({ startTime: newPosition })
  }

  const handleSetStartTime = (position) => {
    playerRef.current.pause()
    console.log(position.target.value)
    setClipControls({ startTime: position.target.value })
  }

  const handleSliderSeekChangeEnd = (newPosition) => {
    console.log(newPosition.target.value)
    //playerRef.current.currentTime(newPosition.target.value)
    setClipControls({ startTime: clipControls.startTime, endTime: newPosition })
  }

  const handleSetEndTime = (position) => {
    playerRef.current.pause()
    console.log(position.target.value)
    setClipControls({
      startTime: clipControls.startTime,
      endTime: position.target.value
    })
    console.log(clipControls)
  }

  function addDebugLine(metadataTime, metadataText) {
    const domString = `
          <span className="debug-data__time">${metadataTime}</span>
          <span className="debug-data__value">${metadataText}</span>`.trim()

    const dataLine = document.createElement('div')
    dataLine.classList.add('class', 'data-line')
    dataLine.innerHTML = domString

    const debugData = document.querySelector('.debug-data')
    debugData.appendChild(dataLine)
  }

  const handleVODChange = (event) => {
    event.preventDefault()
    console.log(
      event.target.options[event.target.selectedIndex].getAttribute('data-path')
    )
    setvodData({
      url: event.target.value,
      path: event.target.options[event.target.selectedIndex].getAttribute(
        'data-path'
      )
    })
    getClips(
      event.target.options[event.target.selectedIndex].getAttribute('data-path')
    )
  }

  const handlePlayClip = (event) => {
    console.log(event)
    setvodData({ url: event })
  }

  return (
    <div className='Home'>
      <div className='page-container'>
        <div className='selector-container '>
          <form>
            <div className='row'>
              <div className='col-xl'>
                <div class='form-group'>
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
              className='videoplayer'
              options={videoJsOptions}
              onReady={handlePlayerReady}
              ref={playerRef}
            />
          ) : (
            <div className='videoplayer'>
              No VOD Selected or No Live recorded Yet...
            </div>
          )}
        </div>
        <div className='controls-container'>
          Clip Controls {position}
          <form>
            <div class='form-group'>
              <div className='row'>
                <div className='col-sm-1'>
                  <button className='btn btn-primary'>Set Start</button>
                </div>
                <div className='col-xl'>
                  <input
                    type='range'
                    id='start'
                    value={
                      clipControls.startTime ? clipControls.startTime : position
                    }
                    class='form-control-range'
                    max={duration}
                    onChange={(e) => handleSliderSeekChangeStart(e)}
                    onClick={(e) => handleSetStartTime(e)}
                  />
                </div>
                <div className='col-sm-1'>
                  <input
                    type='text'
                    class='form-control'
                    id='formGroupExampleInput2'
                    placeholder='20'
                  />
                </div>
              </div>
            </div>
            <div class='form-group'>
              <div className='row'>
                <div className='col-sm-1'>
                  <button className='btn btn-primary'>Set Stop</button>
                </div>
                <div className='col-xl'>
                  <input
                    type='range'
                    id='end'
                    value={
                      clipControls.endTime ? clipControls.endTime : position
                    }
                    max={duration}
                    class='form-control-range'
                    onClick={(e) => handleSetEndTime(e)}
                  />
                </div>
                <div className='col-sm-1'>
                  <input
                    type='text'
                    class='form-control'
                    id='formGroupExampleInput2'
                    placeholder='100'
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className='clips-container'>
          <div className='clips-inline'>
            {listofClips.map((items, index) => (
              <div
                className='card col-sm-3'
                key={index}
                onClick={() => handlePlayClip(items.master)}
              >
                <img
                  class='card-img-top'
                  src={ClipPoster}
                  alt={items.assetID}
                  maxwidth='200'
                  maxheight='150'
                />
                <div class='card-body'>
                  <p class='card-text'>Rec ID: {items.recording}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='debug-container'>
          <div className='debug-data'> debug</div>
        </div>
      </div>
    </div>
  )
}
