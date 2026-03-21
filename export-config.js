#!/usr/bin/env node

// Exports CloudFormation stack outputs to manifest-clip-ui/src/config.json
// Usage: node export-config.js [stack-name] [region]

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const stackName = process.argv[2] || 'clip-manifest-ui'
const region = process.argv[3] || execFileSync('aws', ['configure', 'get', 'region'], { encoding: 'utf8' }).trim() || 'us-west-2'

console.log(`Fetching outputs from stack: ${stackName} (${region})...`)

try {
  const outputs = execFileSync('aws', [
    'cloudformation', 'describe-stacks',
    '--stack-name', stackName,
    '--region', region,
    '--query', 'Stacks[].Outputs'
  ], { encoding: 'utf8' })

  const configPath = path.join(__dirname, 'manifest-clip-ui', 'src', 'config.json')
  fs.writeFileSync(configPath, outputs)

  const parsed = JSON.parse(outputs)[0]
  console.log(`\nWritten to: ${configPath}\n`)
  parsed.forEach(o => console.log(`  ${o.OutputKey}: ${o.OutputValue}`))
  console.log(`\nRun: npm run dev`)
} catch (err) {
  console.error(`Failed: ${err.message}`)
  process.exit(1)
}
