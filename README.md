<a name="module_Xcomfort"></a>

## Xcomfort

[![Travis](https://img.shields.io/travis/oanylund/xcomfort-shc-api.svg?style=flat-square)](https://travis-ci.org/oanylund/xcomfort-shc-api)
[![Codecov](https://img.shields.io/codecov/c/github/oanylund/xcomfort-shc-api.svg?style=flat-square)](https://codecov.io/github/oanylund/xcomfort-shc-api)

This module lets you send commands from node.js to the Xcomfort smart home controller(SHC)
made by Eaton. It has no affiliation with Eaton, and is used at your own risk.

If you have xcomfort and a smart home controller at home, this module
can be used to create custom software for your system.
For example you can create a webpage customized for your home that controls
your lighting instead of that generic app that ships with the SHC

The project is in a very early development stage, and the api can end up being changed dramatically.

### Install
```bash
npm install xcomfort-shc-api
```

### Usage
For more details on usage see [https://oanylund.github.io/xcomfort-shc-api](https://oanylund.github.io/xcomfort-shc-api)
 and the [API reference](#api) below.
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


## <a name="api">API reference<a/>
* [Xcomfort](#exp_module_Xcomfort--Xcomfort) ⇐ <code>[EventEmitter](http://nodejs.org/api/events.html)</code> ⏏
    * [new Xcomfort(params)](#new_module_Xcomfort--Xcomfort_new)
    * _instance_
        * [.login()](#module_Xcomfort--Xcomfort+login)
        * [.query(method, [params], [cb])](#module_Xcomfort--Xcomfort+query) ⇒ <code>Promise</code> &#124; <code>null</code>
        * [.setDimState(deviceName, state, cb)](#module_Xcomfort--Xcomfort+setDimState) ⇒ <code>Promise</code> &#124; <code>null</code>
        * [.getDeviceNames()](#module_Xcomfort--Xcomfort+getDeviceNames) ⇒ <code>Array.&lt;string&gt;</code>
        * [.getSceneNames()](#module_Xcomfort--Xcomfort+getSceneNames) ⇒ <code>Array.&lt;string&gt;</code>
        * [.getNameObject()](#module_Xcomfort--Xcomfort+getNameObject) ⇒ <code>Object</code>
        * [Event: "ready"](#module_Xcomfort--Xcomfort+event_ready)
        * [Event: "error"](#module_Xcomfort--Xcomfort+event_error)
    * _inner_
        * [~initialSetup()](#module_Xcomfort--Xcomfort..initialSetup)
        * [~getZoneDevices(zoneId)](#module_Xcomfort--Xcomfort..getZoneDevices) ⇒ <code>Promise</code>
        * [~getZoneScenes(zoneId)](#module_Xcomfort--Xcomfort..getZoneScenes) ⇒ <code>Promise</code>
        * [~getQueryParams(method, params)](#module_Xcomfort--Xcomfort..getQueryParams) ⇒ <code>Object</code>
        * [~deviceDetail](#module_Xcomfort--Xcomfort..deviceDetail) : <code>object</code>
        * [~sceneDetail](#module_Xcomfort--Xcomfort..sceneDetail) : <code>object</code>
        * [~callback](#module_Xcomfort--Xcomfort..callback) : <code>function</code>
<a name="exp_module_Xcomfort--Xcomfort"></a>

### Xcomfort ⇐ <code>[EventEmitter](http://nodejs.org/api/events.html)</code> ⏏
**Kind**: Exported class  
**Extends**: <code>[EventEmitter](http://nodejs.org/api/events.html)</code>  
**Emits**: <code>[error](#module_Xcomfort--Xcomfort+event_error)</code>, <code>[ready](#module_Xcomfort--Xcomfort+event_ready)</code>  
**Properties**

<table>
  <thead>
    <tr>
      <th>Name</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>baseUrl</td><td><code>string</code></td><td><p>baseUrl from params</p>
</td>
    </tr><tr>
    <td>username</td><td><code>string</code></td><td><p>username from params</p>
</td>
    </tr><tr>
    <td>password</td><td><code>string</code></td><td><p>password from params</p>
</td>
    </tr><tr>
    <td>sessionId</td><td><code>string</code></td><td><p>The session cookie from a valid login</p>
</td>
    </tr><tr>
    <td>deviceMap</td><td><code>Map.&lt;string, module:Xcomfort~deviceDetail&gt;</code></td><td><p>Map with all device details</p>
</td>
    </tr><tr>
    <td>sceneMap</td><td><code>Map.&lt;string, module:Xcomfort~sceneDetail&gt;</code></td><td><p>Map with all scene details</p>
</td>
    </tr>  </tbody>
</table>


* * *

<a name="new_module_Xcomfort--Xcomfort_new"></a>

#### new Xcomfort(params)
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>params</td><td><code>object</code></td><td></td><td><p>config for the SHC</p>
</td>
    </tr><tr>
    <td>params.baseUrl</td><td><code>string</code></td><td></td><td><p>the url to your SHC</p>
</td>
    </tr><tr>
    <td>params.username</td><td><code>string</code></td><td></td><td><p>username to login to SHC</p>
</td>
    </tr><tr>
    <td>params.password</td><td><code>string</code></td><td></td><td><p>password to login to SHC</p>
</td>
    </tr><tr>
    <td>[params.autoSetup]</td><td><code>boolean</code></td><td><code>true</code></td><td><p>If true, class will login and setup
device and scene map automatically</p>
</td>
    </tr>  </tbody>
</table>


* * *

<a name="module_Xcomfort--Xcomfort+login"></a>

#### xcomfort.login()
Sends login request to SHC and stores cookie in [module:Xcomfort#sessionId](module:Xcomfort#sessionId)

**Kind**: instance method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  

* * *

<a name="module_Xcomfort--Xcomfort+query"></a>

#### xcomfort.query(method, [params], [cb]) ⇒ <code>Promise</code> &#124; <code>null</code>
Request method to run on SHC RPC interface

**Kind**: instance method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  
**Returns**: <code>Promise</code> &#124; <code>null</code> - If no callback is passed in it returns a promise that resolves with result  
**See**: http://dz.prosyst.com/pdoc/mBS_SDK_8.0/modules/hdm/api-json/json_rpc_all.html  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>method</td><td><code>string</code></td><td></td><td><p>Method to run</p>
</td>
    </tr><tr>
    <td>[params]</td><td><code>Array</code></td><td><code>[&#x27;&#x27;,&#x27;&#x27;]</code></td><td><p>Array with arguments for method</p>
</td>
    </tr><tr>
    <td>[cb]</td><td><code><a href="#module_Xcomfort--Xcomfort..callback">callback</a></code></td><td></td><td><p>Callback that gets result or error</p>
</td>
    </tr>  </tbody>
</table>


* * *

<a name="module_Xcomfort--Xcomfort+setDimState"></a>

#### xcomfort.setDimState(deviceName, state, cb) ⇒ <code>Promise</code> &#124; <code>null</code>
Sets dimactuator to new state

**Kind**: instance method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  
**Returns**: <code>Promise</code> &#124; <code>null</code> - If no callback is passed in it returns a promise that resolves withtrue or null  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>deviceName</td><td><code>string</code></td><td><p>Name of device(same as configured on SHC). Not case sensitive</p>
</td>
    </tr><tr>
    <td>state</td><td><code>number</code> | <code>string</code></td><td><p>New state of device. Valid values are 0-100(integer) or &#39;on&#39;/&#39;off&#39;</p>
</td>
    </tr><tr>
    <td>cb</td><td><code><a href="#module_Xcomfort--Xcomfort..callback">callback</a></code></td><td><p>Callback with true or false. True if SHC confirmed action</p>
</td>
    </tr>  </tbody>
</table>


* * *

<a name="module_Xcomfort--Xcomfort+getDeviceNames"></a>

#### xcomfort.getDeviceNames() ⇒ <code>Array.&lt;string&gt;</code>
Generates list of all device names

**Kind**: instance method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  

* * *

<a name="module_Xcomfort--Xcomfort+getSceneNames"></a>

#### xcomfort.getSceneNames() ⇒ <code>Array.&lt;string&gt;</code>
Generates list of all scene names

**Kind**: instance method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  

* * *

<a name="module_Xcomfort--Xcomfort+getNameObject"></a>

#### xcomfort.getNameObject() ⇒ <code>Object</code>
Generates object with list of devices and scenes

**Kind**: instance method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  

* * *

<a name="module_Xcomfort--Xcomfort+event_ready"></a>

#### Event: "ready"
Ready event gets when autosetup is complete

**Kind**: event emitted by <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  

* * *

<a name="module_Xcomfort--Xcomfort+event_error"></a>

#### Event: "error"
General error event whenever an error occurs

**Kind**: event emitted by <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  

* * *

<a name="module_Xcomfort--Xcomfort..initialSetup"></a>

#### Xcomfort~initialSetup()
Runs on initialisation. Logs in, then fetches devices and scenes from SHC

**Kind**: inner method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  
**Emits**: <code>[ready](#module_Xcomfort--Xcomfort+event_ready)</code>  

* * *

<a name="module_Xcomfort--Xcomfort..getZoneDevices"></a>

#### Xcomfort~getZoneDevices(zoneId) ⇒ <code>Promise</code>
Gets devices in zone from SHC and adds them to deviceMap with nameof device as key and value of type [deviceDetail](#module_Xcomfort--Xcomfort..deviceDetail)

**Kind**: inner method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  
**Returns**: <code>Promise</code> - - with no value, only used to tell when its done  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>zoneId</td><td><code>string</code></td><td><p>name of zone to get devices in</p>
</td>
    </tr>  </tbody>
</table>


* * *

<a name="module_Xcomfort--Xcomfort..getZoneScenes"></a>

#### Xcomfort~getZoneScenes(zoneId) ⇒ <code>Promise</code>
Gets scenes in zone from SHC and adds them to sceneMap with nameof scene as key and value of type [sceneDetail](#module_Xcomfort--Xcomfort..sceneDetail)

**Kind**: inner method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  
**Returns**: <code>Promise</code> - - with no value, only used to tell when its done  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>zoneId</td><td><code>string</code></td><td><p>name of zone to get devices in</p>
</td>
    </tr>  </tbody>
</table>


* * *

<a name="module_Xcomfort--Xcomfort..getQueryParams"></a>

#### Xcomfort~getQueryParams(method, params) ⇒ <code>Object</code>
Configure request parameters

**Kind**: inner method of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  
**Returns**: <code>Object</code> - Object to pass to request as options  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>method</td><td><code>String</code></td><td><p>Remote method to query on SHC</p>
</td>
    </tr><tr>
    <td>params</td><td><code>Array</code></td><td><p>Array of arguments to pass to method</p>
</td>
    </tr>  </tbody>
</table>


* * *

<a name="module_Xcomfort--Xcomfort..deviceDetail"></a>

#### Xcomfort~deviceDetail : <code>object</code>
**Kind**: inner typedef of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  
**Properties**

<table>
  <thead>
    <tr>
      <th>Name</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>zoneId</td><td><code>string</code></td><td><p>Zone id</p>
</td>
    </tr><tr>
    <td>id</td><td><code>string</code></td><td><p>Device id</p>
</td>
    </tr><tr>
    <td>type</td><td><code>string</code></td><td><p>SHC class type</p>
</td>
    </tr><tr>
    <td>value</td><td><code>string</code></td><td><p>Device value</p>
</td>
    </tr>  </tbody>
</table>


* * *

<a name="module_Xcomfort--Xcomfort..sceneDetail"></a>

#### Xcomfort~sceneDetail : <code>object</code>
**Kind**: inner typedef of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  
**Properties**

<table>
  <thead>
    <tr>
      <th>Name</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>zoneId</td><td><code>string</code></td><td><p>Zone id</p>
</td>
    </tr><tr>
    <td>id</td><td><code>string</code></td><td><p>Scene id</p>
</td>
    </tr>  </tbody>
</table>


* * *

<a name="module_Xcomfort--Xcomfort..callback"></a>

#### Xcomfort~callback : <code>function</code>
Callback with result or error

**Kind**: inner typedef of <code>[Xcomfort](#exp_module_Xcomfort--Xcomfort)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>error</td><td><code>Error</code></td><td><p>null if no error</p>
</td>
    </tr><tr>
    <td>result</td><td></td><td><p>null if error</p>
</td>
    </tr>  </tbody>
</table>


* * *

