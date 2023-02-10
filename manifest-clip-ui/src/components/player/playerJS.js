// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react'
import videojs from 'video.js'
import { registerIVSTech, registerIVSQualityPlugin } from 'amazon-ivs-player'

function VideoJS(props) {
  //const videoRef = React.useRef(null);
  const playerRef = React.useRef(null)
  const placeholderRef = React.useRef(null) // workaround for react 18 https://github.com/videojs/video.js/issues/7746
  const { options, onReady } = props

  registerIVSTech(videojs, options)
  registerIVSQualityPlugin(videojs, options)

  React.useEffect(() => {
    // make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const placeholderEl = placeholderRef.current // workaround for react 18 https://github.com/videojs/video.js/issues/7746
      const videoElement = placeholderEl.appendChild(
        document.createElement('video-js')
      )
      if (!videoElement) return
      // ini video js
      const player = (playerRef.current = videojs(videoElement, options, () => {
        console.log('player is ready')
        onReady && onReady(player)

        videoElement.textTracks.addEventListener(
          'addtrack',
          function (addTrackEvent) {
            var track = addTrackEvent.track
            track.mode = 'hidden'
            console.log('Track', track)
            track.addEventListener('cuechange', cueChangeEvent)
          }
        )

        console.log('Text track detected', videoElement.textTracks)
      }))
      const cueChangeEvent = (evt) => {
        console.log('I have something from player', evt)
      }
    } else {
      // you can update player here [update player through props]
    }
  }, [onReady, options])

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return <div ref={placeholderRef}></div>
}
export default VideoJS
