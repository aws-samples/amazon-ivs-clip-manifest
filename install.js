#!/usr/bin/env node

const { execSync, execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')
const { loadResources, saveResources } = require('./cleanup.js')

const ROOT_DIR = __dirname
const STACK_NAME_REGEX = /^[a-zA-Z0-9-]+$/

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateStackName(name) {
  if (!name || !STACK_NAME_REGEX.test(name)) {
    return 'Stack name must only contain alphanumeric characters and hyphens (a-z, A-Z, 0-9, -)'
  }
  return true
}

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', cwd: ROOT_DIR, ...opts })
}

function runFile(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: 'inherit', cwd: ROOT_DIR, ...opts })
}

function runCapture(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', cwd: ROOT_DIR, ...opts }).trim()
}

function commandExists(cmd) {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function trackStack(stackName) {
  const resources = loadResources()
  if (!resources.stacks) resources.stacks = []
  if (!resources.stacks.includes(stackName)) {
    resources.stacks.push(stackName)
    saveResources(resources)
  }
}

// ---------------------------------------------------------------------------
// Pre-flight checks
// ---------------------------------------------------------------------------

function preflight(needsAWS) {
  const missing = []

  if (!commandExists('node')) missing.push('node')
  if (needsAWS) {
    if (!commandExists('aws')) missing.push('aws (AWS CLI)')
    if (!commandExists('sam')) missing.push('sam (AWS SAM CLI)')
  }

  if (missing.length > 0) {
    console.log(chalk.red(`\n  Missing required tools: ${missing.join(', ')}`))
    console.log(chalk.yellow('  Install them and try again.\n'))
    process.exit(1)
  }

  if (needsAWS) {
    try {
      const identity = JSON.parse(runCapture('aws', ['sts', 'get-caller-identity']))
      const region = runCapture('aws', ['configure', 'get', 'region']).trim() || 'not set'
      console.log(chalk.blue(`  AWS Account: ${identity.Account}`))
      console.log(chalk.blue(`  AWS Region:  ${region}\n`))
    } catch {
      console.log(chalk.red('\n  AWS credentials not configured. Run: aws configure\n'))
      process.exit(1)
    }
  }
}

// ---------------------------------------------------------------------------
// Deploy actions
// ---------------------------------------------------------------------------

async function deployBackend() {
  preflight(true)

  const { stackName, region } = await inquirer.prompt([
    {
      type: 'input',
      name: 'stackName',
      message: 'Stack name:',
      default: 'clip-manifest-ui',
      validate: validateStackName
    },
    {
      type: 'input',
      name: 'region',
      message: 'AWS region:',
      default: runCapture('aws', ['configure', 'get', 'region']) || 'us-east-1'
    }
  ])

  console.log(chalk.yellow('\n  Deploying Backend APIs...\n'))
  console.log(chalk.blue(`  Stack:  ${stackName}`))
  console.log(chalk.blue(`  Region: ${region}`))
  console.log(chalk.blue(`  Dir:    serverless/\n`))

  const samDir = path.join(ROOT_DIR, 'serverless')

  run('sam build', { cwd: samDir })

  runFile('sam', [
    'deploy',
    '--stack-name', stackName,
    '--region', region,
    '--capabilities', 'CAPABILITY_IAM',
    '--resolve-s3',
    '--force-upload'
  ], { cwd: samDir })

  trackStack(stackName)
  console.log(chalk.green('\n  Backend deployed successfully!\n'))

  return { stackName, region }
}

async function deployStandalone() {
  preflight(true)

  const { stackName, region } = await inquirer.prompt([
    {
      type: 'input',
      name: 'stackName',
      message: 'Stack name:',
      default: 'ivs-clip-standalone',
      validate: validateStackName
    },
    {
      type: 'input',
      name: 'region',
      message: 'AWS region:',
      default: runCapture('aws', ['configure', 'get', 'region']) || 'us-east-1'
    }
  ])

  console.log(chalk.yellow('\n  Deploying Standalone API...\n'))
  console.log(chalk.blue(`  Stack:  ${stackName}`))
  console.log(chalk.blue(`  Region: ${region}`))
  console.log(chalk.blue(`  Dir:    standalone-api/\n`))

  const samDir = path.join(ROOT_DIR, 'standalone-api')

  run('sam build', { cwd: samDir })

  runFile('sam', [
    'deploy',
    '--stack-name', stackName,
    '--region', region,
    '--capabilities', 'CAPABILITY_IAM',
    '--resolve-s3',
    '--force-upload'
  ], { cwd: samDir })

  trackStack(stackName)
  console.log(chalk.green('\n  Standalone API deployed successfully!\n'))

  return { stackName, region }
}

async function startLocalUI(stackName, region) {
  preflight(true)

  if (!stackName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'stackName',
        message: 'Backend stack name:',
        default: 'clip-manifest-ui',
        validate: validateStackName
      },
      {
        type: 'input',
        name: 'region',
        message: 'AWS region:',
        default: runCapture('aws', ['configure', 'get', 'region']) || 'us-east-1'
      }
    ])
    stackName = answers.stackName
    region = answers.region
  }

  console.log(chalk.yellow('\n  Configuring UI from stack outputs...\n'))

  const regionArgs = region ? ['--region', region] : []
  const stackOutputs = runCapture('aws', [
    'cloudformation', 'describe-stacks',
    '--stack-name', stackName,
    '--query', 'Stacks[].Outputs',
    ...regionArgs
  ])

  const configPath = path.join(ROOT_DIR, 'manifest-clip-ui', 'src', 'config.json')
  fs.writeFileSync(configPath, stackOutputs)
  console.log(chalk.green('  config.json written from stack outputs'))

  console.log(chalk.blue('\n  Starting development server...\n'))
  run('npm start', { cwd: path.join(ROOT_DIR, 'manifest-clip-ui') })
}

async function startLocalMock() {
  preflight(false)

  console.log(chalk.yellow('\n  Starting mock server + UI (no AWS needed)...\n'))
  run('npm run dev:mock')
}

async function deployUIToCloud(stackName, region) {
  preflight(true)

  if (!stackName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'stackName',
        message: 'Backend stack name (to extract API endpoints):',
        default: 'clip-manifest-ui',
        validate: validateStackName
      },
      {
        type: 'input',
        name: 'region',
        message: 'AWS region:',
        default: runCapture('aws', ['configure', 'get', 'region']) || 'us-east-1'
      }
    ])
    stackName = answers.stackName
    region = answers.region
  }

  // Write config.json so the build has API endpoints
  const regionArgs = region ? ['--region', region] : []
  const stackOutputs = runCapture('aws', [
    'cloudformation', 'describe-stacks',
    '--stack-name', stackName,
    '--query', 'Stacks[].Outputs',
    ...regionArgs
  ])
  const configPath = path.join(ROOT_DIR, 'manifest-clip-ui', 'src', 'config.json')
  fs.writeFileSync(configPath, stackOutputs)
  console.log(chalk.green('  config.json written from stack outputs'))

  console.log(chalk.yellow('\n  Building React app...\n'))
  run('npm run build', { cwd: path.join(ROOT_DIR, 'manifest-clip-ui') })

  const { uiStackName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'uiStackName',
      message: 'UI hosting stack name:',
      default: 'clip-manifest-ui-hosting',
      validate: validateStackName
    }
  ])

  console.log(chalk.yellow('\n  Deploying UI to CloudFront...\n'))
  const deployDir = path.join(ROOT_DIR, 'manifest-clip-ui', 'public-deploy')

  run('sam build', { cwd: deployDir })

  runFile('sam', [
    'deploy',
    '--stack-name', uiStackName,
    '--region', region,
    '--capabilities', 'CAPABILITY_IAM',
    '--resolve-s3',
    '--force-upload'
  ], { cwd: deployDir })

  trackStack(uiStackName)

  // Sync build output to S3
  try {
    const uiOutputs = runCapture('aws', [
      'cloudformation', 'describe-stacks',
      '--stack-name', uiStackName,
      '--query', 'Stacks[0].Outputs[?OutputKey==`S3Bucket`].OutputValue',
      '--output', 'text',
      ...regionArgs
    ])

    if (uiOutputs) {
      console.log(chalk.blue(`\n  Syncing build to s3://${uiOutputs}...\n`))
      runFile('aws', [
        's3', 'sync',
        path.join(ROOT_DIR, 'manifest-clip-ui', 'build'),
        `s3://${uiOutputs}/`,
        ...regionArgs
      ])
    }
  } catch {
    console.log(chalk.yellow('  Could not auto-sync build files. Sync manually with: aws s3 sync manifest-clip-ui/build/ s3://<bucket>/'))
  }

  console.log(chalk.green('\n  UI deployed to cloud successfully!\n'))
}

async function deployRealtime() {
  preflight(true)

  const { stackName, region } = await inquirer.prompt([
    {
      type: 'input',
      name: 'stackName',
      message: 'Stack name:',
      default: 'ivs-rt-recorder',
      validate: validateStackName
    },
    {
      type: 'input',
      name: 'region',
      message: 'AWS region:',
      default: runCapture('aws', ['configure', 'get', 'region']) || 'us-east-1'
    }
  ])

  console.log(chalk.yellow('\n  Deploying Real-Time Recorder...\n'))
  console.log(chalk.blue(`  Stack:  ${stackName}`))
  console.log(chalk.blue(`  Region: ${region}`))
  console.log(chalk.blue(`  Dir:    realtime-recorder/\n`))

  const samDir = path.join(ROOT_DIR, 'realtime-recorder')

  run('sam build', { cwd: samDir })

  runFile('sam', [
    'deploy',
    '--stack-name', stackName,
    '--region', region,
    '--capabilities', 'CAPABILITY_IAM',
    '--resolve-s3',
    '--force-upload'
  ], { cwd: samDir })

  trackStack(stackName)
  console.log(chalk.green('\n  Real-Time Recorder deployed successfully!\n'))

  return { stackName, region }
}

// ---------------------------------------------------------------------------
// Main menu
// ---------------------------------------------------------------------------

const options = [
  {
    name: '1. Local Development (Mock Server + UI)        No AWS needed',
    value: 'mock'
  },
  {
    name: '2. Deploy Backend APIs                         Full serverless backend + IVS',
    value: 'backend'
  },
  {
    name: '3. Start Local UI (Connected to AWS)           Requires backend deployed',
    value: 'local-ui'
  },
  {
    name: '4. Deploy Standalone API Only                  Clipping API only',
    value: 'standalone'
  },
  {
    name: '5. Deploy UI to Cloud                          Host on CloudFront',
    value: 'deploy-ui'
  },
  {
    name: '6. Full Solution (Backend + Local UI)          Deploy + start UI',
    value: 'complete'
  },
  {
    name: '7. Deploy Real-Time Recorder                   RT Stage + Recording',
    value: 'realtime'
  }
]

async function main() {
  console.log(chalk.blue.bold('\n  Amazon IVS Clip Manifest Solution\n'))

  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: [...options, new inquirer.Separator(), { name: 'Exit', value: 'exit' }]
      }
    ])

    if (choice === 'exit') {
      console.log(chalk.blue('\n  Goodbye!\n'))
      break
    }

    try {
      switch (choice) {
        case 'mock':
          await startLocalMock()
          return

        case 'backend':
          await deployBackend()
          break

        case 'local-ui':
          await startLocalUI()
          return

        case 'standalone':
          await deployStandalone()
          break

        case 'deploy-ui':
          await deployUIToCloud()
          break

        case 'realtime':
          await deployRealtime()
          break

        case 'complete': {
          const { stackName, region } = await deployBackend()
          await startLocalUI(stackName, region)
          return
        }
      }
    } catch (error) {
      console.error(chalk.red(`\n  Failed: ${error.message}\n`))
    }

    console.log('')
  }
}

main().catch(console.error)
