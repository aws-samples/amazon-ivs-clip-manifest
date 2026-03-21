// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, {
  useState,
  useContext,
  createContext,
  useRef,
  useEffect
} from 'react'
import './styles/DebugLog.css'

const DebugContext = createContext()

export const DebugProvider = ({ children }) => {
  const [logs, setLogs] = useState([])

  const addDebugLine = (time, text) => {
    setLogs((prev) => [...prev, { time, text }])
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <DebugContext.Provider value={{ logs, addDebugLine, clearLogs }}>
      {children}
    </DebugContext.Provider>
  )
}

export const useDebug = () => {
  const context = useContext(DebugContext)
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider')
  }
  return context
}

export const DebugLog = () => {
  const { logs, clearLogs } = useDebug()
  const debugContainerRef = useRef(null)

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.toLocaleTimeString()}.${date
      .getMilliseconds()
      .toString()
      .padStart(3, '0')}`
  }

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (debugContainerRef.current) {
      debugContainerRef.current.scrollTop =
        debugContainerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div>
      <div className='debug-header'>
        <span>Debug data:</span>
        <button
          className='btn btn-outline-secondary btn-sm'
          onClick={clearLogs}
        >
          Clear Logs
        </button>
      </div>
      <div className='debug-data' ref={debugContainerRef}>
        {logs.map((log, index) => (
          <div key={index} className='data-line'>
            <span className='debug-data__time'>{formatTime(log.time)}</span>
            <span className='debug-data__value'>{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DebugLog
