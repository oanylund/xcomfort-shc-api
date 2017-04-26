import request from 'request';
import EventEmitter from 'events';
import Promise from 'bluebird';

/**
 * Node.js Xcomfort smarthome controller api
 * @module Xcomfort
 * @typicalname xapi
 */

// Privates
import { deviceTypes } from './constants';
import {
  initialSetup,
  getZoneDevices,
  getZoneScenes,
  importSetup
} from './init';
import {
  getQueryParams,
  checkIfDeviceExists,
  invokeDCOOperation
} from './utils';

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
  * @param {object} [params.importSetupPath] - Path to json setup file with device and scene maps
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
  constructor({
    baseUrl,
    username,
    password,
    autoSetup=true,
    importSetupPath
  } = {}) {
    super();

    if(!baseUrl) throw new Error('No baseUrl supplied');
    if(!username) throw new Error('No username supplied');
    if(!password) throw new Error('No password supplied');

    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;

    this.sessionId = null;

    this.deviceMap = new Map();
    this.sceneMap = new Map();

    if(importSetupPath) {
      importSetup.call(this, importSetupPath);
      return;
    }

    if(autoSetup) initialSetup.call(this);
  }

  /**
   * General error event emitted when internal errors occur
   * @event module:Xcomfort#error
   */
  _error(msg) {
    this.emit('error', new Error(msg));
  }
  /**
   * Sends login request to SHC and stores cookie in sessionId
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
      (error, response = {}, body) => {
        if(response.statusCode === 403) {
          return reject(new Error('Wrong username or password'));
        }
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
   * @param {module:Xcomfort~callback} [cb] - Callback (err,result)
   * @returns {Promise} Resolves with result
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
   * @param {module:Xcomfort~callback} [cb] - Callback with true or false result. True if SHC confirmed action
   * @returns {Promise} Resolves with true or false. True if SHC confirmed action
   */
  setDimState(deviceName, state, cb) {

    return checkIfDeviceExists.call(this, deviceName, deviceTypes.DIM_ACTUATOR)
      .then( ({zoneId, id}) => {

        // Validate state
        if( ( Number.isInteger(state) && (state < 0 || state > 100 ) ) ||
        ( (typeof state === 'string') && (state !== 'on' && state !== 'off') ) ) {
          return Promise.reject('State value not valid (on/off or 0-100 integer)');
        }

        // method StatusControlFunction/controlDevice
        // params [zone, lightuid, level='on','off',0-100]
        return this.query(
          'StatusControlFunction/controlDevice',
          [zoneId, id, state.toString()])
          .then( (res) => (res && res.status === 'ok') )

      })
      .asCallback(cb);

  }
  /**
   * Tells DimActuator to start continously dimming brighter.
   * How fast is configured on the device by the MRF software
   * @param  {String} deviceName            - Device name of DimActuator
   * @param  {module:Xcomfort~callback} cb  - Callback
   * @return {Promise}                      - Resolves undefined
   */
  dimBrighter(deviceName, cb) {
    return checkIfDeviceExists.call(this, deviceName, deviceTypes.DIM_ACTUATOR)
      .then( ({id, type}) => invokeDCOOperation.call(this, id, type, 'brighter'))
      .asCallback(cb);
  }
  /**
   * Triggers scene
   * @param {string} sceneName - Name of scene(same as configured on SHC). Not case sensitive
   * @param {module:Xcomfort~callback} [cb] - Callback with true or false result. True if SHC confirmed action
   * @returns {Promise} Resolves with true or false. True if SHC confirmed action
   */
  triggerScene(sceneName, cb) {
    const lowerCaseName = sceneName.toLowerCase();

    // Validate that a scene with this name exist
    if(!this.sceneMap.has(lowerCaseName)) {
      return Promise.reject('No scene with that name exists')
        .asCallback(cb);
    }

    const {zoneId, id} = this.sceneMap.get(lowerCaseName);

    // method SceneFunction/triggerScene
    // params [zone, sceneid]
    return this.query('SceneFunction/triggerScene', [zoneId, id])
        .then( (res) => (res && res.status === 'ok') )
        .asCallback(cb);

  }
  /**
   * Generates list of all device names
   * @returns {Array.<string>}
   */
  getDeviceNames() {
    return [...this.deviceMap.keys()];
  }
  /**
   * Generates list of all scene names
   * @returns {Array.<string>}
   */
  getSceneNames() {
    return [...this.sceneMap.keys()];
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
