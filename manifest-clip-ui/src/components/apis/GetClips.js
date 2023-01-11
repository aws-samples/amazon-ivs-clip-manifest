export function getClipsAPI(pathfilter) {
  console.log('filter', pathfilter)
  const url = `https://nopxir0z9i.execute-api.us-east-1.amazonaws.com/Prod/getclips?vod=${pathfilter}`
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
