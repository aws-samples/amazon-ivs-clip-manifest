// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { GET_RECORDING_API } from '../../config'

export function getRecordingsAPI() {
  console.log('get Recordings', GET_RECORDING_API)
  const url = GET_RECORDING_API

  return fetch(url, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json'
    })
  })
    .then((data) => {
      console.log(data)
      return data.json()
    })
    .catch((error) => {
      console.error('Error', error)
      return error
    })
}
