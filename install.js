#!/usr/bin/env node

const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { loadResources, saveResources } = require('./cleanup.js');

const STACK_NAME_REGEX = /^[a-zA-Z0-9-]+$/;

function validateStackName(name) {
  if (!name || !STACK_NAME_REGEX.test(name)) {
    return 'Stack name must only contain alphanumeric characters and hyphens (a-z, A-Z, 0-9, -)';
  }
  return true;
}

console.log(chalk.blue.bold('\n🎬 Amazon IVS Clip Manifest Solution\n'));

const options = [
  {
    name: '1. Deploy Backend APIs (Deploy the backend for the UI Solution)',
    value: 'backend',
    description: 'Deploy Lambda functions, API Gateway, S3, CloudFront, and IVS Channel'
  },
  {
    name: '2. Start Local UI Server',
    value: 'local-ui',
    description: 'Run React UI locally (requires backend deployed)'
  },
  {
    name: '3. Deploy Standalone API Only',
    value: 'standalone',
    description: 'Deploy only the clip manifest API (no UI support)'
  },
  {
    name: '4. Deploy UI to Cloud',
    value: 'deploy-ui',
    description: 'Host the React UI on CloudFront (public access)'
  },
  {
    name: '5. Full Solution (Backend + Local UI)',
    value: 'complete',
    description: 'Deploy backend with IVS channel and start local UI server'
  }
];

async function main() {
  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to install?',
        choices: [...options, { name: 'Exit', value: 'exit' }]
      }
    ]);

    if (choice === 'exit') {
      console.log(chalk.blue('\n👋 Goodbye!'));
      break;
    }

    switch (choice) {
      case 'backend':
        await deployBackend();
        break;
      case 'local-ui':
        await startLocalUI();
        return; // Exit after starting UI server
      case 'standalone':
        await deployStandalone();
        break;
      case 'deploy-ui':
        await deployUIToCloud();
        break;
      case 'complete':
        await deployBackend();
        process.chdir('..');
        await startLocalUI();
        return; // Exit after starting UI server
    }
    
    console.log(chalk.blue('\n🔄 Returning to main menu...\n'));
  }
}

async function deployBackend() {
  console.log(chalk.yellow('\n📦 Deploying Backend APIs...\n'));
  
  try {
    process.chdir('serverless');
    
    console.log(chalk.blue('Building and deploying with SAM...'));
    execSync(`sam deploy --guided`, { stdio: 'inherit' });
    
    console.log(chalk.green('✅ Backend deployed successfully!'));
    
    process.chdir('..');
  } catch (error) {
    console.error(chalk.red('❌ Deployment failed:', error.message));
  }
}

async function createIVSChannel() {
  console.log(chalk.yellow('\n📺 Creating IVS Channel...\n'));
  
  const { stackName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'stackName',
      message: 'Enter your backend stack name:',
      default: 'clip-manifest-ui',
      validate: validateStackName
    }
  ]);

  await setupIVSChannel(stackName);
}

async function setupIVSChannel(stackName) {
  console.log(chalk.yellow('\n📺 Setting up IVS Channel...\n'));
  
  try {
    // Get bucket name from stack outputs
    const stackOutput = execFileSync('aws', [
      'cloudformation', 'describe-stacks',
      '--stack-name', stackName,
      '--query', 'Stacks[0].Outputs[?OutputKey==`RecordConfigurationBucket`].OutputValue',
      '--output', 'text'
    ], { encoding: 'utf8' }).trim();
    
    console.log(chalk.blue('Creating IVS recording configuration...'));
    const recordingConfig = execFileSync('aws', [
      'ivs', 'create-recording-configuration',
      '--name', 'ivs-clip-recording-config',
      '--recording-reconnect-window-seconds', '60',
      '--destination-configuration', `s3={bucketName=${stackOutput}}`,
      '--thumbnail-configuration', 'recordingMode=INTERVAL,targetIntervalSeconds=30',
      '--output', 'json'
    ], { encoding: 'utf8' });
    
    const recordingArn = JSON.parse(recordingConfig).recordingConfiguration.arn;
    console.log(chalk.green('✅ Recording configuration created'));
    
    console.log(chalk.blue('Creating IVS channel...'));
    const channel = execFileSync('aws', [
      'ivs', 'create-channel',
      '--name', 'ivs-clip-channel',
      '--recording-configuration-arn', recordingArn,
      '--output', 'json'
    ], { encoding: 'utf8' });
    
    const channelData = JSON.parse(channel);
    
    // Track created resources
    const resources = loadResources();
    if (!resources.ivsChannels) resources.ivsChannels = [];
    if (!resources.recordingConfigs) resources.recordingConfigs = [];
    
    resources.ivsChannels.push(channelData.channel.arn);
    resources.recordingConfigs.push(recordingArn);
    saveResources(resources);
    
    console.log(chalk.green('✅ IVS Channel created successfully!'));
    console.log(chalk.yellow(`📺 Channel ARN: ${channelData.channel.arn}`));
    console.log(chalk.yellow(`🔑 Stream Key: ${channelData.streamKey.value}`));
    console.log(chalk.yellow(`📡 Ingest Endpoint: ${channelData.channel.ingestEndpoint}`));
    console.log(chalk.yellow(`🔗 RTMPS URL: rtmps://${channelData.channel.ingestEndpoint}/live/${channelData.streamKey.value}`));
    
  } catch (error) {
    console.error(chalk.red('❌ IVS setup failed:', error.message));
    console.log(chalk.yellow('💡 You can create the IVS channel manually later'));
  }
}

async function deployStandalone() {
  console.log(chalk.yellow('\n📦 Deploying Standalone API...\n'));
  
  const { stackName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'stackName',
      message: 'Enter stack name:',
      default: 'ivs-clip-standalone',
      validate: validateStackName
    }
  ]);
  
  try {
    process.chdir('standalone-api');
    
    console.log(chalk.blue('Cleaning previous build...'));
    execSync(`rm -rf .aws-sam`, { stdio: 'inherit' });
    
    console.log(chalk.blue('Building SAM application...'));
    execSync(`sam build`, { stdio: 'inherit' });
    
    console.log(chalk.blue('Deploying with SAM...'));
    execFileSync('sam', [
      'deploy',
      '--stack-name', stackName,
      '--capabilities', 'CAPABILITY_IAM',
      '--resolve-s3',
      '--force-upload'
    ], { stdio: 'inherit' });
    
    // Track the stack
    const resources = loadResources();
    if (!resources.stacks) resources.stacks = [];
    if (!resources.stacks.includes(stackName)) {
      resources.stacks.push(stackName);
      saveResources(resources);
    }
    
    console.log(chalk.green('✅ Standalone API deployed successfully!'));
    
    process.chdir('..');
  } catch (error) {
    console.error(chalk.red('❌ Deployment failed:', error.message));
  }
}

async function startLocalUI() {
  console.log(chalk.yellow('\n🎨 Starting Local UI Server...\n'));
  
  const { stackName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'stackName',
      message: 'Enter your backend stack name:',
      default: 'clip-manifest-ui',
      validate: validateStackName
    }
  ]);

  try {
    process.chdir('manifest-clip-ui');
    
    console.log(chalk.blue('Installing dependencies...'));
    execSync('npm install', { stdio: 'inherit' });
    
    console.log(chalk.blue('Extracting API endpoints from stack...'));
    const stackOutputs = execFileSync('aws', [
      'cloudformation', 'describe-stacks',
      '--stack-name', stackName,
      '--query', 'Stacks[].Outputs'
    ], { encoding: 'utf8' });
    fs.writeFileSync(path.join('src', 'config.json'), stackOutputs);
    
    console.log(chalk.green('✅ Local UI setup complete!'));
    console.log(chalk.blue('🚀 Starting development server...'));
    
    execSync('npm start', { stdio: 'inherit' });
    
  } catch (error) {
    console.error(chalk.red('❌ Local UI setup failed:', error.message));
    console.log(chalk.yellow('💡 Make sure your backend is deployed first'));
  }
}

async function deployUIToCloud() {
  console.log(chalk.yellow('\n☁️ Deploying UI to Cloud...\n'));
  
  try {
    process.chdir('manifest-clip-ui');
    
    console.log(chalk.blue('Building React app...'));
    execSync('npm run build', { stdio: 'inherit' });
    
    process.chdir('public-deploy');
    
    console.log(chalk.blue('Deploying to CloudFront...'));
    execSync('sam deploy --guided', { stdio: 'inherit' });
    
    console.log(chalk.green('✅ UI deployed to cloud successfully!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Cloud UI deployment failed:', error.message));
  }
}

main().catch(console.error);
