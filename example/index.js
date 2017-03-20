// Xcomfort SHC api
// ========================

// This module lets you send commands from node.js to the Xcomfort smart home controller(SHC)
// made by Eaton. It has no affiliation with Eaton, and is used at your own risk.
//
// If you have xcomfort and a smart home controller at home, this module
// can be used to create custom software for your system.
// For example you can create a webpage customized for your home that controls
// your lighting instead of that generic app that ships with the SHC

// Usage
// =====

// Import the module
const Xcomfort = require('xcomfort-shc-api');

// First we need to create the config for the SHC
//
// By default, the autoSetup parameter is set to true.
// When autoSetup is set to true,
// immediately when you create the instance, the module will do a login and then automatically
// fetch all your available devices and scenes and create internal lists with all information
// needed to send commands.
const config = {
  baseUrl: 'http://192.168.0.10', // The url to reach the SHC on your network
  username: 'user',               // The username to login to the system
  password: '1234'                // The password for that user
  autoSetup: true                 // Defaults to true.
}


// We then create a new instance for this SHC.
const xapi = new Xcomfort(config);

// The module extends nodes eventemitter, so we must listen for the 'error' event.
// If we don't listen for this event, the app will crash whenever an error occures.
// Handle errors as you want.
xapi.on('error' (error) => {
  console.log(error);
});

// When autosetup is used, the module emits a 'ready' event we must wait for before
// we can start sending commands.
xapi.on('ready', () => {
  changeLighting();
});

// Changing actuator states
// ------------------------
// Lets send some commands to change light states.
// Say we have a light named "kitchen light" on the SHC.
// The module uses the same names as configured on the SHC.
// When you want confirmation, or something to happen after you have two choices.
// Either use a callback, or treat it as a promise.
// Both the callback and the resolved promise will return true if
// the change is confirmed from SHC, or it will be falsy if not.

//
const changeLighting = () => {

  // Apply a third argument with a callback function
  xapi.setDimState('kitchen light', 30, (status) => {
    if (status) {
      console.log('Kitchen light dimmed to 30%');
    }
  })

  // If no callback the setDimState will return a promise.
  xapi.setDimState('dining light', 'off')
    .then((status) => {
      if (status) {
        console.log('Dining light turned off');
        return xapi.setDimState('bathroom light', 'on');
      }
    })
    .then((status) => {
      if (status) {
        console.log('Bathroom light turned on');
      }
    })
    .catch((error) => {
      console.log(error);
    });

}
