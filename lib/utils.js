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
