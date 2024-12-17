// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react'
import ClipPoster from './../img/clipposter.svg'
import './styles/ClipsGallery.css'

const ClipsGallery = ({ clips, onClipSelect }) => {
  return (
    <div className='clips-container'>
      <div className='clips-inline'>
        {clips.map((item, index) => (
          <div
            className='card col-sm-2'
            key={index}
            onClick={() => onClipSelect(item.master, item)} // Pass the entire item
          >
            <img
              className='card-img-top'
              src={ClipPoster}
              alt={item.assetID}
              maxwidth='200'
              maxheight='150'
            />
            <div className='card-body'>
              <p className='card-text card-overflow'>ID: {item.execution}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClipsGallery
