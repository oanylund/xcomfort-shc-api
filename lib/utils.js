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
