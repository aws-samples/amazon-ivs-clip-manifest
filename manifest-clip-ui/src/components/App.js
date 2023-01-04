import React, { useEffect, useState } from 'react'
import './App.css'
import Home from './HomePage'
import FetchRecordings from './apis/GetRecordings'
import FetchClips from './apis/GetClips'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

export default function App(props) {
  const [apiGetRecordings, setRecordings] = useState(null)
  const [apiGetClips, setClips] = useState(null)
  useEffect(() => {
    ;(async function () {
      // async func
    })()
    console.log('component mounted!')
  }, [])

  const openIVSdocs = () => {
    window.location.href = 'https://docs.aws.amazon.com/ivs/' //Will take you to Google.
  }

  return (
    <div className='App'>
      <FetchRecordings onRecFetched={setRecordings} />
      <FetchClips onClipsFetched={setClips} />
      <nav className='navbar navbar-dark bg-dark'>
        <a class='navbar-brand' href='#'>
          IVS Manifest Clipping
        </a>
        <button
          id='openplayer'
          className='btn btn-outline-info'
          onClick={openIVSdocs}
        >
          IVS Docs
        </button>
      </nav>
      <Router>
        <Routes>
          <Route
            path='/Recordings'
            element={
              <FetchRecordings onRecFetched={setRecordings} {...props} />
            }
          />
          <Route
            path='/'
            element={
              <Home
                {...props}
                recordings={apiGetRecordings}
                clips={apiGetClips}
              />
            }
          />
        </Routes>
      </Router>
    </div>
  )
}
