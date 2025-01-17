// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect, useState } from 'react'
import Home from './components/HomePage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

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
      <nav className='navbar navbar-dark bg-dark'>
        <a class='navbar-brand align' href='#'>
          IVS Manifest Clipping
        </a>
        <button
          id='openplayer'
          className='btn btn-outline-info align'
          onClick={openIVSdocs}
        >
          IVS Docs
        </button>
      </nav>
      <Router>
        <Routes>
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
