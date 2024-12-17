// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { POST_CLIPMANIFEST_API } from '../../config'

export function createClipAPI(start_time, end_time, master_url, byte_range) {
  if (byte_range === undefined || byte_range === null) byte_range = false
  console.log('data', start_time, end_time, master_url, byte_range)
  const url = `${POST_CLIPMANIFEST_API}`
  return fetch(url, {
    method: 'POST',
    headers: new Headers({
      Accept: 'application/json'
    }),
    body: JSON.stringify({
      start_time: start_time,
      end_time: end_time,
      master_url: master_url,
      byte_range: byte_range
    })
  })
    .then((data) => {
      console.log(data)
      return data.json()
    })
    .catch((error) => {
      if (byte_range === true) {
        alert(
          `Error, Check if this stream support byte range manifest, try again with byte range as false\n
        ${error}`
        )
      } else alert(`Error, ${error}`)
      console.error('Error', error)

      return error
    })
}
