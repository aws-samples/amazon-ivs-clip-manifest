//import React, { useState, useEffect } from 'react'
// you should import .env or .config instead of

export default function GetRecordings() {
  const url =
    'https://nopxir0z9i.execute-api.us-east-1.amazonaws.com/Prod/getrecordings/'

  fetch(url, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json'
    })
  })
    .then((response) => response.json())
    .then((response) => {
      console.log('success', response)
      return response
    })
    .catch((error) => {
      console.error('Error', error)
      return error
    })
}
