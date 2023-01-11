// you should import .env or .config instead of

export function getRecordingsAPI() {
  console.log('get Recordings')
  const url =
    'https://nopxir0z9i.execute-api.us-east-1.amazonaws.com/Prod/getrecordings/'

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
