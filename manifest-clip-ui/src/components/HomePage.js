import React, { useRef } from 'react'
import './styles/HomePage.style.css'
import VideoPlayer from './player/playerJS'

export default function HomePage() {
  const playerRef = useRef(null)

  const videoURL =
    'https://3d26876b73d7.us-west-2.playback.live-video.net/api/video/v1/us-west-2.913157848533.channel.rkCBS9iD1eyd.m3u8'

  const videoJsOptions = {
    autoplay: 'muted', //mute audio when page loads, but auto play video
    controls: true,
    responsive: true,
    fluid: true,
    width: 896,
    height: 504,
    sources: [
      {
        src: videoURL,
        type: 'application/x-mpegURL'
      }
    ]
  }

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

  return (
    <div className='Home'>
      <div className='page-container'>
        <div className='selector-container '>
          <form>
            <div className='row'>
              <div className='col-xl'>
                <div class='form-group'>
                  <select className='custom-select large' required>
                    <option value=''>Open this select menu</option>
                    <option value='1'>Video One</option>
                    <option value='2'>Video Two</option>
                    <option value='3'>Video Three</option>
                  </select>
                </div>
              </div>
              <div class='col-sm-1'>
                <button className='btn btn-primary'>Load</button>
              </div>
            </div>
          </form>
        </div>
        <div className='video-container'>
          <VideoPlayer
            className='videoplayer'
            options={videoJsOptions}
            onReady={handlePlayerReady}
          />
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
            <div className='card col-sm-3'>
              <img
                class='card-img-top'
                src='https://i.ytimg.com/vi/l_tHgIVfk_8/maxresdefault.jpg'
                alt='Card image cap'
                width='100'
                height='200'
              />
              <div class='card-body'>
                <p class='card-text'>Clip 1</p>
              </div>
            </div>
            <div className='card col-sm-3'>
              <img
                class='card-img-top'
                src='https://i.ytimg.com/vi/l_tHgIVfk_8/maxresdefault.jpg'
                alt='Card image cap'
                width='100'
                height='200'
              />
              <div class='card-body'>
                <p class='card-text'>Clip 1</p>
              </div>
            </div>
            <div className='card col-sm-3'>
              <img
                class='card-img-top'
                src='https://i.ytimg.com/vi/l_tHgIVfk_8/maxresdefault.jpg'
                alt='Card image cap'
                width='100'
                height='200'
              />
              <div class='card-body'>
                <p class='card-text'>Clip 1</p>
              </div>
            </div>
            <div className='card col-sm-3'>
              <img
                class='card-img-top'
                src='https://i.ytimg.com/vi/l_tHgIVfk_8/maxresdefault.jpg'
                alt='Card image cap'
                width='100'
                height='200'
              />
              <div class='card-body'>
                <p class='card-text'>Clip 1</p>
              </div>
            </div>
            <div className='card col-sm-3'>
              <img
                class='card-img-top'
                src='https://i.ytimg.com/vi/l_tHgIVfk_8/maxresdefault.jpg'
                alt='Card image cap'
                width='100'
                height='200'
              />
              <div class='card-body'>
                <p class='card-text'>Clip 1</p>
              </div>
            </div>
          </div>
        </div>

        <div className='debug-container'>
          <div className='debug-data'> debug</div>
        </div>
      </div>
    </div>
  )
}
