# xcomfort-shc-api

[![Travis](https://img.shields.io/travis/oanylund/xcomfort-shc-api.svg?style=flat-square)](https://travis-ci.org/oanylund/xcomfort-shc-api)
[![Codecov](https://img.shields.io/codecov/c/github/oanylund/xcomfort-shc-api.svg?style=flat-square)](https://codecov.io/github/oanylund/xcomfort-shc-api)

Node.js api for the Xcomfort smart home controller(SHC)
made by Eaton. It has no affiliation with Eaton, and is used at your own risk.

The module can be used to interface Xcomfort to other systems,
create custom logic, or just for fun!

## Notice!
This library is not under active development due to the developer not having access to a Xcomfort system anymore. If someone with access to the hardware would like to drive this library forward that would be awesome!

### Prerequisite
You need to own a smart home controller(CHCA-00/01)
and it needs to be available on your network.

### Install
```bash
npm install xcomfort-shc-api
```

### Usage
For more details on usage see [https://oanylund.github.io/xcomfort-shc-api](https://oanylund.github.io/xcomfort-shc-api)
 and the [API reference](API.md).
```js
const Xcomfort = require('xcomfort-shc-api');

const xapi = new Xcomfort({
  baseUrl: 'http://192.168.0.10', // The url to reach the SHC on your network
  username: 'user', // The username to login to the system
  password: '1234' // The password for that user
  autoSetup: true // Defaults to true.
});

xapi.on('ready', () => {
  xapi.setDimState('kitchen light', 20)
    .then((status) => {
      if(status) {
        console.log('Kitchen light set to 20%');
      }
    });
});
```
