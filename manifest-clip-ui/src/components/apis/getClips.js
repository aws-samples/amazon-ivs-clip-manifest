// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { GET_CLIPS_API } from '../../config'

export function getClipsAPI(pathfilter) {
  console.log('filter', pathfilter)
  const url = `${GET_CLIPS_API}?vod=${pathfilter}`
  return fetch(url, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json'
    })
  })
    .then((data) => data.json())
    .catch((error) => {
      console.error('Error', error)
      return error
    })
}
