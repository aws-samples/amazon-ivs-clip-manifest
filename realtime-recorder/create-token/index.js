// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

'use strict'

const { IVSRealTimeClient, CreateParticipantTokenCommand } = require('@aws-sdk/client-ivs-realtime')

const client = new IVSRealTimeClient({})
const STAGE_ARN = process.env.STAGE_ARN

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
  }

  try {
    const userId = event.queryStringParameters?.userId || `user-${Date.now()}`

    const command = new CreateParticipantTokenCommand({
      stageArn: STAGE_ARN,
      userId,
      capabilities: ['PUBLISH', 'SUBSCRIBE'],
      duration: 720
    })

    const response = await client.send(command)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token: response.participantToken.token,
        participantId: response.participantToken.participantId,
        expirationTime: response.participantToken.expirationTime
      })
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: error.$metadata?.httpStatusCode || 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
