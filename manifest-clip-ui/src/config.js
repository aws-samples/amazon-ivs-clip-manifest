import config from './config.json'

function getAPIValues(key) {
  const index = config[0].findIndex((o) => o.OutputKey === key)
  return config[0][index].OutputValue
}

export const GET_RECORDING_API = getAPIValues('ApiURLGetRecordings')
