import React, { useState, useEffect } from 'react'

export default function GetRecordings() {
  let recordings = useState(null)

  useEffect(
    () => {
      ;(async function () {
        recordings = await getAPI('https://dog.ceo/api/breeds/image/random')
      })()
    },
    [recordings],
    console.log(recordings)
  )

  async function getAPI(url, requestOptions) {
    let result

    await fetch(url, requestOptions)
      .then((response) => response.json())
      .then((response) => (result = response))
      .catch((error) => console.error('Error:', error))
    console.log(result)
    return result
  }

  if (recordings) {
    console.log('here', recordings.message)
  }

  return recordings != undefined ? (
    <div>
      {recordings.message}
      <>{recordings}</>
    </div>
  ) : (
    <div>loading</div>
  )
}
