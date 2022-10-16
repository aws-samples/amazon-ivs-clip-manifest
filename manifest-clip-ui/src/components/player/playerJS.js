import React from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

export const VideoJS = (props) => {
  const placeholderRef = React.useRef(null)
  const playerRef = React.useRef(null)
  const { options, onReady } = props

  React.useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const placeholderEl = placeholderRef.current
      const videoElement = placeholderEl.appendChild(
        document.createElement('video-js')
      )

      const player = (playerRef.current = videojs(videoElement, options, () => {
        player.log('player is ready')
        onReady && onReady(player)
      }))

      // You can update player in the `else` block here, for example:
    } else {
      const player = playerRef.current
      player.autoplay(options.autoplay)
      player.src(options.sources)
    }
  }, [options, onReady])

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  return <div ref={placeholderRef}></div>
}

export default VideoJS
