import utils from './utils';

describe('getQueryParams', () => {

  const obj = {
    baseUrl: '12345',
    user: 'userman',
    password: 'pass',
    sessionId: 'q2312314'
  }

  it('should return expected object', () => {
      expect(utils.getQueryParams.call(obj, 'method', ['params']))
        .toEqual({
          url: obj.baseUrl + '/remote/json-rpc',
          method: 'post',
          headers: {
            Cookie: 'JSESSIONID=' + obj.sessionId,
            // 'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
            Accept: 'application/json, text/javascript, */*; q=0.01',
          },
          json: {
            jsonrpc: '2.0',
            method: 'method',
            params: ['params'],
            id: 1
          }
        });
  });

});
