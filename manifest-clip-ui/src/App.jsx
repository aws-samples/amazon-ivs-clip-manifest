// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect, useState } from 'react'
import Home from './components/HomePage'
import RTPublisher from './components/RTPublisher'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
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

  return (
    <div className='App'>
      <Router>
        <nav className='navbar navbar-dark bg-dark'>
          <Link className='navbar-brand align' to='/'>
            IVS Manifest Clipping
          </Link>
          <div className='nav-links'>
            <Link className='btn btn-outline-info align' to='/'>
              Clip Editor
            </Link>
            <Link className='btn btn-outline-info align' to='/rt-publisher'>
              Real-Time Publisher
            </Link>
          </div>
        </nav>
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
          <Route path='/rt-publisher' element={<RTPublisher />} />
        </Routes>
      </Router>
    </div>
  )
}
