import React, { useRef, useEffect, useState } from 'react'
import './styles/HomePage.style.css'
import VideoPlayer from './player/playerJS'
import ClipPoster from './../img/clipposter.svg'

export default function HomePage(props) {
  const playerRef = useRef(null)
  const [vodData, setvodData] = useState({ url: '', path: '' })

  const videoJsOptions = {
    autoplay: 'muted', //mute audio when page loads, but auto play video
    controls: true,
    responsive: true,
    fluid: true,
    width: 896,
    height: 504,
    sources: [
      {
        src: vodData.url,
        type: 'application/x-mpegURL'
      }
    ]
  }

  let [listofRec, setListofRec] = useState([])
  let [listofClips, setListofClips] = useState([])

  useEffect(
    () => {
      console.log('Effect')
      if (props.recordings) {
        setListofRec(props.recordings)
        setvodData({
          url: props.recordings[0].master,
          path: props.recordings[0].path
        })
      }
      if (props.clips) setListofClips(props.clips)

      return () => {
        //second
      }
    },
    [props],
    console.log('PROPS', props, vodData)
  )

  const handlePlayerReady = (player) => {
    player.on('waiting', () => {
      console.log('player is waiting')
    })

    player.on('dispose', () => {
      console.log('player will dispose')
    })

    player.on('playing', () => {
      console.log('player playing')
      addDebugLine(Date.now(), 'Player playing')
    })

    player.on('error', (err) => {
      console.log('Play Error', err)
      addDebugLine(Date.now(), `Player ${err.type} ${err.target.innerText}`)
    })

    playerRef.current = player
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
            />
          ) : (
            <div className='videoplayer'>
              No VOD Selected or No Live recorded Yet...
            </div>
          )}
        </div>
        <div className='controls-container'>
          Clip Controls
          <form>
            <div class='form-group'>
              <div className='row'>
                <div className='col-sm-1'>
                  <button className='btn btn-primary'>Set Start</button>
                </div>
                <div className='col-xl'>
                  <input
                    type='range'
                    value='20'
                    class='form-control-range'
                    id='formControlRange'
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
                    value='100'
                    class='form-control-range'
                    id='formControlRange'
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
              <div className='card col-sm-3' key={index}>
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
