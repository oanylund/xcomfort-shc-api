import request from 'request';
import EventEmitter from 'events';
import Promise from 'bluebird';

/**
 * Node.js Xcomfort smarthome controller api
 * @module Xcomfort
 * @typicalname xapi
 */

// Privates
import { initialSetup, getZoneDevices, getZoneScenes } from './init';
import { getQueryParams } from './utils';

/**
 * @external EventEmitter
 * @see http://nodejs.org/api/events.html
 */

 /**
  * @param {object} params - config for the SHC
  * @param {string} params.baseUrl - the url to your SHC
  * @param {string} params.username - username to login to SHC
  * @param {string} params.password - password to login to SHC
  * @param {boolean} [params.autoSetup=true] - If true, class will login and setup
  * device and scene map automatically
  * @prop {string} baseUrl - baseUrl from params
  * @prop {string} username - username from params
  * @prop {string} password - password from params
  * @prop {string} sessionId - The session cookie from a valid login
  * @prop {Map.<string,module:Xcomfort~deviceDetail>} deviceMap - Map with all device details
  * @prop {Map.<string,module:Xcomfort~sceneDetail>} sceneMap - Map with all scene details
  * @emits module:Xcomfort#error
  * @emits module:Xcomfort#ready
  * @extends external:EventEmitter
  * @alias module:Xcomfort
  */
class Xcomfort extends EventEmitter {
  constructor({ baseUrl, username, password, autoSetup=true }) {
    super();

    if(!baseUrl || !username || !password)
      this._error('No config supplied');

    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;

    this.sessionId = null;

    this.deviceMap = new Map();
    this.sceneMap = new Map();

    if(autoSetup) initialSetup.call(this);
  }

  /**
   * General error event whenever an error occurs
   * @event module:Xcomfort#error
   */
  _error(msg) {
    this.emit('error', new Error(msg));
  }
  /**
   * Sends login request to SHC and stores cookie in {@link module:Xcomfort#sessionId}
   */
  login() {
    // login to server to get cookie
    return new Promise( (resolve, reject) => {
      request({
        url: this.baseUrl + '/system/http/login',
        method: 'post',
        form: {
          u: this.username,
          p: this.password,
          referer: '/bcgui/index.html'
        },
        jar: true
      },
      (error, response, body) => {
        if(error || response.statusCode !== 200) {
          const err = error ? error : new Error('Login failed');
          return reject(err);
        }

        // Save cookie if login is successful
        this.sessionId = response.headers['set-cookie'][0].split(';')[0].split('=')[1];

        resolve();
      });
    });
  }
  /**
   * Request method to run on SHC RPC interface
   * @param {string} method - Method to run
   * @param {Array} [params=['','']] - Array with arguments for method
   * @param {module:Xcomfort~callback} [cb] - Callback that gets result or error
   * @returns {(Promise|null)} If no callback is passed in it returns a promise that resolves with result
   * @see http://dz.prosyst.com/pdoc/mBS_SDK_8.0/modules/hdm/api-json/json_rpc_all.html
   */
  query(method, params=['',''], cb) {
    const requestOptions = getQueryParams.call(this, method,params);

    return new Promise( (resolve, reject) => {
      request(requestOptions, (error, response = {}, body) => {

        if(error) {
          return reject(error);
        }
        // Authenticate if not authorized
        if(response.statusCode === 401) {
          return resolve(this.login().then( () => this.query(method, params) ));
        }
        if(response.statusCode === 200) {
          if(body && body.error) {
            return reject(body.error);
          }
          if(body && !body.result) {
            return reject('No result, verify method and params');
          }
          if(body && body.result === 'unsupported method called') {
            return reject('Unsupported method called');
          }
          return resolve(body && body.result);
        }

        return reject('Unknown error occured');
      });
    })
    .asCallback(cb); // call callback if with error-first convention if cb is a function
  }
  /**
   * Sets dimactuator to new state
   * @param {string} deviceName - Name of device(same as configured on SHC). Not case sensitive
   * @param {(number|string)} state - New state of device. Valid values are 0-100(integer) or 'on'/'off'
   * @param {module:Xcomfort~callback} cb - Callback with true or false. True if SHC confirmed action
   * @returns {(Promise|null)} If no callback is passed in it returns a promise that resolves with
   * true or null
   */
  setDimState(deviceName, state, cb) {
    const lowerCaseName = deviceName.toLowerCase();

    // Validate that a device with this name exist
    if(!this.deviceMap.has(lowerCaseName)) {
      this._error('setDimState: No device with name that exists');
      return;
    }

    const {zoneId, id, type} = this.deviceMap.get(lowerCaseName);

    // Validate that device is of correct type
    if (type !== 'DimActuator') {
      this._error('setDimState: No dimmable device with name that exists');
      return;
    }

    // Validate state
    if( ( Number.isInteger(state) && (state < 0 || state > 100 ) ) &&
      (state !== 'on' || state !== 'off') ) {
      this._error('setDimState: State value not valid (on/off or 0-100 integer)');
      return;
    }

    // method StatusControlFunction/controlDevice
    // params [zone, lightuid, level='on','off',0-100]
    if(cb) {
      this.query(
        'StatusControlFunction/controlDevice',
        [zoneId, id, state.toString()],
        (res) => cb( res && res.status === 'ok' )
      );
      return;
    }

    return this.query(
      'StatusControlFunction/controlDevice',
      [zoneId, id, state.toString()])
        .then( (res) => (res && res.status === 'ok') );

  }
  triggerScene() {
    // method SceneFunction/triggerScene
    // params [zone, sceneid]
  }
  /**
   * Generates list of all device names
   * @returns {Array.<string>}
   */
  getDeviceNames() {
    const deviceNames = [];
    this.deviceMap.forEach( (device, name) => deviceNames.push(name) );
    return deviceNames;
  }
  /**
   * Generates list of all scene names
   * @returns {Array.<string>}
   */
  getSceneNames() {
    const sceneNames = [];
    this.sceneMap.forEach( (scene, name) => sceneNames.push(name) );
    return sceneNames;
  }
  /**
   * Generates object with list of devices and scenes
   * @returns {Object}
   */
  getNameObject() {
    return {
      devices: this.getDeviceNames(),
      scenes: this.getSceneNames()
    }
  }
}

/**
 * Callback with result or error
 * @callback module:Xcomfort~callback
 * @param {Error} error - null if no error
 * @param {} result - null if error
 */

module.exports = Xcomfort;
