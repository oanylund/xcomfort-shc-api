#!/usr/bin/env node

const cli = require('commander');
const path = require('path');
const fs = require('fs');
const Xapi = require('../dist/Xcomfort');
let configPath;

// 1. Parse arguments
cli
  .arguments('<configpath>')
  .action( (configpath) => {
    configPath = configpath;
  });

cli.parse(process.argv);

// Exit if no argument supplied
if(typeof configPath === 'undefined') {
  console.error('No config path supplied');
  process.exit(1);
}

let config;

const generateConfig = () => {
  // Instantiate new xcomfort object with autoSetup
  const xapi = new Xapi({
    baseUrl: config.baseUrl,
    username: config.username,
    password: config.password,
    autoSetup: true
  });

  // When autoSetup is complete, continue
  xapi.on('ready', () => {

    // Generate json content
    const setup = {
      devices: [...xapi.deviceMap],
      scenes: [...xapi.sceneMap]
    }
    // Stringify content to write to file
    const setupJson = JSON.stringify(setup, null, 4);
    // Create savepath
    const savePath = path.join(process.cwd(),config.output);

    // Create setup file on disk
    fs.writeFile(savePath, setupJson, { flag: 'wx' }, (err) => {

      // Exit if file already exists
      if(err && err.code === 'EEXIST') {
        console.log('Setup file already exists, delete it if you want to generate a new one, exiting.');
        return;
      }
      // Exit if any errors
      else if(err) {
        console.log(err);
        return;
      }

      // Exit with success if file created
      console.log("Setup successfully file created, exiting.");
      process.exit(0);

    });
  });
}

// 2. Read config file
fs.readFile(path.join(process.cwd(),configPath), 'utf8', (err, data) => {

  // Exit if reading failed
  if (err) {
    console.error('Reading file failed, exiting.');
    console.error('Reason: ', err.message);
    process.exit(1);
  }

  // Start parsing file
  try {
    config = JSON.parse(data);
  }
  catch (jsonErr) {
    // Exit if parsing failed
    console.error('JSON parsing failed, exiting.');
    console.error('Reason: ', jsonErr.message);
    process.exit(1);
  }

  // 3. Start generating setup file.
  console.log('Config file read and parsed, starting to generate setup file.');
  generateConfig();

});
