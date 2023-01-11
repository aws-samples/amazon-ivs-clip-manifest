import config from './config.json'

function getAPIValues(key) {
  const index = config[0].findIndex((item) => item.OutputKey === key)
  return config[0][index].OutputValue
}

export const GET_RECORDING_API = getAPIValues('ApiURLGetRecordings')
export const GET_CLIPS_API = getAPIValues('ApiURLGetClips')
export const POST_CLIPMANIFEST_API = getAPIValues('ApiURLCreateClip')
