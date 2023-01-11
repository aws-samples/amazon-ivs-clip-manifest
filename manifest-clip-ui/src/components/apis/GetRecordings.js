// you should import .env or .config instead of
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
    .then((response) => response.json())
    .catch((error) => {
      console.error('Error', error)
      return error
    })
}
