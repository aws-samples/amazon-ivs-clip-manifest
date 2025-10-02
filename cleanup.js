#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');

const RESOURCES_FILE = '.deployed-resources.json';

console.log(chalk.red.bold('\n🧹 Amazon IVS Clip Manifest Cleanup\n'));

async function main() {
  const resources = loadResources();
  
  if (!resources || Object.keys(resources).length === 0) {
    console.log(chalk.yellow('No tracked resources found.'));
    console.log(chalk.blue('You can still manually delete CloudFormation stacks and IVS resources.'));
    return;
  }

  console.log(chalk.yellow('Found tracked resources:'));
  Object.entries(resources).forEach(([type, items]) => {
    console.log(chalk.blue(`  ${type}:`), items.join(', '));
  });

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Delete all tracked resources?',
      default: false
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Cleanup cancelled.'));
    return;
  }

  await cleanupResources(resources);
}

function loadResources() {
  try {
    if (fs.existsSync(RESOURCES_FILE)) {
      return JSON.parse(fs.readFileSync(RESOURCES_FILE, 'utf8'));
    }
  } catch (error) {
    console.log(chalk.yellow('Could not load resource tracking file.'));
  }
  return {};
}

function saveResources(resources) {
  try {
    fs.writeFileSync(RESOURCES_FILE, JSON.stringify(resources, null, 2));
  } catch (error) {
    console.log(chalk.yellow('Could not save resource tracking file.'));
  }
}

async function cleanupResources(resources) {
  // Delete IVS channels first
  if (resources.ivsChannels) {
    for (const channelArn of resources.ivsChannels) {
      try {
        console.log(chalk.blue(`Deleting IVS channel: ${channelArn}`));
        execSync(`aws ivs delete-channel --arn "${channelArn}"`, { stdio: 'inherit' });
        console.log(chalk.green('✅ IVS channel deleted'));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to delete IVS channel: ${error.message}`));
      }
    }
  }

  // Delete recording configurations
  if (resources.recordingConfigs) {
    for (const configArn of resources.recordingConfigs) {
      try {
        console.log(chalk.blue(`Deleting recording configuration: ${configArn}`));
        execSync(`aws ivs delete-recording-configuration --arn "${configArn}"`, { stdio: 'inherit' });
        console.log(chalk.green('✅ Recording configuration deleted'));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to delete recording config: ${error.message}`));
      }
    }
  }

  // Delete CloudFormation stacks
  if (resources.stacks) {
    for (const stackName of resources.stacks) {
      try {
        console.log(chalk.blue(`Deleting CloudFormation stack: ${stackName}`));
        execSync(`aws cloudformation delete-stack --stack-name "${stackName}"`, { stdio: 'inherit' });
        console.log(chalk.green('✅ Stack deletion initiated'));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to delete stack: ${error.message}`));
      }
    }
  }

  // Clear tracking file
  fs.unlinkSync(RESOURCES_FILE);
  console.log(chalk.green('\n✅ Cleanup completed! Resource tracking cleared.'));
}

// Export functions for use in install.js
module.exports = { loadResources, saveResources };

if (require.main === module) {
  main().catch(console.error);
}
