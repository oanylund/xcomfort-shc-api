import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';

const utils = module.exports;

/**
 * Configure request parameters
 * @param  {String} method - Remote method to query on SHC
 * @param  {Array} params - Array of arguments to pass to method
 * @return {Object}        Object to pass to request as options
 * @alias module:Xcomfort~getQueryParams
 */
utils.getQueryParams = function (method, params) {
  return {
    url: this.baseUrl + '/remote/json-rpc',
    method: 'post',
    headers: {
      Cookie: 'JSESSIONID=' + this.sessionId,
      // 'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
      Accept: 'application/json, text/javascript, */*; q=0.01',
    },
    json: {
      jsonrpc: '2.0',
      method,
      params,
      id: 1
    }
  }
}
/**
 * Reads json files
 * @param  {string} filePath - Relative path from workdir
 * @return {Promise} - Returns JSON object
 */
utils.readJsonFile = function (filePath) {
  return new Promise( (resolve, reject) => {
    fs.readFile(path.join(process.cwd(), filePath), 'utf8', (err, data) => {
      // Reject if reading failed
      if (err) {
        return reject(err);
      }

      let jsonObj;

      // Try parsing file
      try {
        jsonObj = JSON.parse(data);
      }
      catch (jsonErr) {
        // Reject if parsing failed
        return reject(jsonErr);
      }

      // File successfully read and parsed, resolve JSON object
      resolve(jsonObj);
    });
  });
}
/**
 * Checks if devices with devicetype(optional) exists
 * @param  {String} deviceName  - SHC id of the device
 * @param  {String} deviceType  - SHC devicetype
 * @return {Promise}
 * @fulfil {Object}             - Device properties
 * @reject {String}             - Error message of one of the following:
 *
 * - `Device name must be of type string`: deviceName was not a string
 * - `No device with that name exists`: Device not found
 * - `No deviceType with that name exists`: No device with correct type found
 * @alias module:Xcomfort~checkIfDeviceExists
 */
utils.checkIfDeviceExists = function (deviceName, deviceType) {
  if(typeof deviceName !== 'string') {
    return Promise.reject('Device name must be of type string');
  }

  const lowerCaseName = deviceName.toLowerCase();

  // Validate that a device with this name exist
  if(!this.deviceMap.has(lowerCaseName)) {
    return Promise.reject('No device with that name exists')
  }

  const device = this.deviceMap.get(lowerCaseName);

  // Validate that device is of correct type if argument exists
  if (deviceType && device.type !== deviceType) {
    return Promise.reject('No ' + deviceType + ' with that name exists')
  }

  return Promise.resolve(device);
}
/**
 * Invoke DCO operation on SHC
 * @param  {String} id        - SHC id of the device
 * @param  {String} type      - SHC devicetype
 * @param  {String} operation - Operation on deviceclass to invoke
 * @param  {Object} params    - key-value pairs of arguments for operation
 * @return {Promise}          - resolves undefined if no error during query
 * @alias module:Xcomfort~invokeDCOOperation
 */
utils.invokeDCOOperation = function (id, type, operation, params) {
  return this.query('HDAccess/invokeDCOOperation',
    [
      'hdm:xComfort Adapter:' + id.split(':')[1],
      'com.eaton.xcomfort.hdm.dc.' + type,
      operation,
      params
    ]
  );
}
