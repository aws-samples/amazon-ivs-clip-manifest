// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

'use strict'

const {
  IVSRealTimeClient,
  StartCompositionCommand,
  StopCompositionCommand,
  GetCompositionCommand
} = require('@aws-sdk/client-ivs-realtime')

const client = new IVSRealTimeClient({})
const STAGE_ARN = process.env.STAGE_ARN
const STORAGE_CONFIG_ARN = process.env.STORAGE_CONFIG_ARN
const ENCODER_CONFIG_ARN = process.env.ENCODER_CONFIG_ARN

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
  }

  try {
    const action = event.path?.includes('stop') ? 'stop' : 'start'

    if (action === 'start') {
      const command = new StartCompositionCommand({
        stageArn: STAGE_ARN,
        destinations: [{
          s3: {
            storageConfigurationArn: STORAGE_CONFIG_ARN,
            encoderConfigurationArns: [ENCODER_CONFIG_ARN]
          }
        }],
        layout: {
          grid: {}
        }
      })

      const response = await client.send(command)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          compositionArn: response.composition.arn,
          state: response.composition.state,
          stageArn: response.composition.stageArn
        })
      }
    }

    if (action === 'stop') {
      const body = JSON.parse(event.body || '{}')

      if (!body.compositionArn) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'compositionArn is required' })
        }
      }

      const command = new StopCompositionCommand({ arn: body.compositionArn })
      await client.send(command)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ stopped: true, compositionArn: body.compositionArn })
      }
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
