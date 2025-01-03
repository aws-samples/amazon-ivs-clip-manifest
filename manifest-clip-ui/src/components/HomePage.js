// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useRef, useEffect, useState } from 'react'
import './styles/HomePage.css'
import VideoPlayer from './player/playerJS'
import ClipPoster from './../img/clipposter.svg'
import VODPoster from './../img/vodposter.svg'
import { getClipsAPI } from './apis/getClips'
import { getRecordingsAPI } from './apis/getRecordings'
import { DebugProvider, useDebug, DebugLog } from './DebugLog'
import ClipControls from './ClipControls'
import ClipsGallery from './ClipsGallery'
import { createClipAPI } from './apis/createClip'
import ClipPlayerModal from './player/ClipPlayerModal'

// Wrap the main component to use debug context
function HomePageContent() {
  // Player states
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const playerRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [playClip, setPlayingClip] = useState(false)

  // Data states
  const [vodData, setvodData] = useState({ url: '', path: '' })
  const [listofRec, setListofRec] = useState([])
  const [listofClips, setListofClips] = useState([])

  // Get debug context
  const { addDebugLine } = useDebug()

  const [clipModalData, setClipModalData] = useState({
    isOpen: false,
    url: '',
    id: '',
    clipData: null
  })

  useEffect(() => {
    if (!vodData.url) handleRecodingData()

    if (loaded && playerRef.current) {
      const timeUpdateHandler = () => {
        setPosition(playerRef.current?.currentTime() || 0)
      }

      playerRef.current.on('timeupdate', timeUpdateHandler)
      return () => {
        playerRef.current.off('timeupdate', timeUpdateHandler)
      }
    }
  }, [loaded, vodData.url])

  const videoJsOptions = {
    autoplay: 'muted',
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
    try {
      addDebugLine(Date.now(), 'Fetching available recordings...')
      const items = await getRecordingsAPI()
      setListofRec(items)

      if (items?.length > 0) {
        const newVodData = {
          url: items[0].master,
          path: items[0].path
        }
        setvodData(newVodData)
        addDebugLine(Date.now(), `Loading recording: ${items[0].assetID}`)
        getClips(items[0].path)
      } else {
        addDebugLine(Date.now(), 'No recordings available')
        setvodData({ url: '', path: '' })
      }
    } catch (error) {
      console.error('Error fetching recordings:', error)
      addDebugLine(Date.now(), `Error loading recordings: ${error.message}`)
      setvodData({ url: '', path: '' })
      setListofRec([])
    }
  }

  const getClips = async (voddata) => {
    try {
      addDebugLine(Date.now(), 'Fetching available clips...')
      const items = await getClipsAPI(voddata)
      addDebugLine(Date.now(), `Found ${items.length} clips`)
      setListofClips(items)
    } catch (error) {
      console.error('Error fetching clips:', error)
      addDebugLine(Date.now(), `Error loading clips: ${error.message}`)
      setListofClips([])
    }
  }

  const handlePlayerReady = (player) => {
    if (!loaded) {
      setLoaded(true)
      addDebugLine(Date.now(), 'Player initialized')
    }

    player.on('waiting', () => {
      addDebugLine(Date.now(), 'Player buffering...')
    })

    player.on('playing', () => {
      const newDuration = player.duration().toFixed(0)
      setDuration(newDuration)
      addDebugLine(Date.now(), `Player playing - Duration: ${newDuration}s`)
    })

    player.on('error', (err) => {
      addDebugLine(Date.now(), `Player error: ${err.type} ${err.message || ''}`)
    })

    player.on('pause', () => {
      addDebugLine(Date.now(), 'Player paused')
    })

    playerRef.current = player
  }

  const handleVODChange = (event) => {
    event.preventDefault()
    setPlayingClip(false)
    const path =
      event.target.options[event.target.selectedIndex].getAttribute('data-path')
    const assetId = event.target.options[event.target.selectedIndex].text

    setvodData({
      url: event.target.value,
      path: path
    })

    addDebugLine(Date.now(), `Switching to VOD: ${assetId}`)

    if (playerRef.current) {
      playerRef.current.src({
        src: event.target.value,
        type: 'application/x-mpegURL'
      })
      playerRef.current.currentTime(0)
    }

    getClips(path)
  }

  const handlePlayClip = (clipUrl, item) => {
    addDebugLine(Date.now(), `Opening clip: ${item.execution}`)
    setClipModalData({
      isOpen: true,
      url: clipUrl,
      id: item.execution,
      clipData: {
        year: item.year,
        month: item.month,
        day: item.day,
        hour: item.hour,
        minute: item.minute,
        master: item.master
      }
    })
  }

  const handleCloseClipModal = () => {
    addDebugLine(Date.now(), 'Closing clip player')
    setClipModalData({ isOpen: false, url: '', id: '' })
  }

  const handleCreateClip = (startTime, endTime, byteRange) => {
    return new Promise((resolve, reject) => {
      if (startTime === null || endTime === null) {
        const error = 'Please select a start and end time'
        addDebugLine(Date.now(), `Create Clip Error: ${error}`)
        alert(error)
        reject(error)
        return
      }

      if (startTime > endTime) {
        const error = 'Start time must be less than end time'
        addDebugLine(Date.now(), `Create Clip Error: ${error}`)
        alert(error)
        reject(error)
        return
      }

      addDebugLine(
        Date.now(),
        `Creating clip... Start: ${startTime}, End: ${endTime}, ByteRange: ${byteRange}`
      )

      return createClipAPI(startTime, endTime, vodData.url, byteRange)
        .then((response) => {
          addDebugLine(
            Date.now(),
            `Clip created successfully: ${JSON.stringify(response)}`
          )
          getClips(vodData.path)
          resolve(response)
        })
        .catch((error) => {
          console.error('Error:', error)
          addDebugLine(Date.now(), `Clip creation failed: ${error.message}`)
          reject(error)
        })
    })
  }

  return (
    <div className='Home'>
      <div className='page-container'>
        <div className='selector-container'>
          <select
            value={vodData.url}
            className='vod-select'
            required
            onChange={handleVODChange}
          >
            {listofRec.map((item, index) => (
              <option key={index} value={item.master} data-path={item.path}>
                Select the VOD: {item.assetID}
              </option>
            ))}
          </select>
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
          <ClipControls
            position={position}
            duration={duration}
            playerRef={playerRef}
            disabled={playClip}
            vodData={vodData}
            onCreateClip={handleCreateClip} // Pass the handler instead of direct API call
          />
        </div>

        <div className='debug-container'>
          <DebugLog />
        </div>

        <div className='clips-container'>
          <ClipsGallery clips={listofClips} onClipSelect={handlePlayClip} />
        </div>

        <ClipPlayerModal
          isOpen={clipModalData.isOpen}
          onClose={handleCloseClipModal}
          clipUrl={clipModalData.url}
          clipId={clipModalData.id}
          clipData={clipModalData.clipData}
          addDebugLine={addDebugLine}
        />
      </div>
    </div>
  )
}

// Wrap the component with DebugProvider
export default function HomePage() {
  return (
    <DebugProvider>
      <HomePageContent />
    </DebugProvider>
  )
}
