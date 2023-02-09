import { POST_CLIPMANIFEST_API } from '../../config'

export function createClipAPI(start_time, end_time, master_url, byte_range) {
  //"start_time\": 1,\"end_time\": 15,\"master_url\":
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
    .then((data) => data.json())
    .catch((error) => {
      console.error('Error', error)
      return error
    })
}
