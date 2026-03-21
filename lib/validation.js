// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

'use strict'

function validateRequiredFields({ startTime, endTime, urlMaster, byteRange }) {
  if (
    !startTime ||
    !endTime ||
    !urlMaster ||
    byteRange === undefined ||
    byteRange === null ||
    typeof byteRange !== 'boolean'
  ) {
    throw Object.assign(
      new Error('start_time, end_time, master_url, and byte_range are required.'),
      { statusCode: 400 }
    )
  }
}

function validateEndTime({ startTime, endTime }) {
  if (endTime <= startTime || endTime === 0) {
    throw Object.assign(
      new Error('end_time must be greater than start_time.'),
      { statusCode: 400 }
    )
  }
}

function validateNumericFields({ startTime, endTime }) {
  if (isNaN(startTime) || isNaN(endTime)) {
    throw Object.assign(
      new Error('start_time and end_time must be numbers.'),
      { statusCode: 400 }
    )
  }
}

function validateByteRange(rawMasterManifest, byteRange) {
  if (rawMasterManifest === null && byteRange === true) {
    throw Object.assign(
      new Error('This stream does not support byte range manifest'),
      { statusCode: 404 }
    )
  }
}

module.exports = {
  validateRequiredFields,
  validateEndTime,
  validateNumericFields,
  validateByteRange
}
