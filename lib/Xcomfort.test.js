import nock from 'nock';
import Xapi from './Xcomfort';

const params = {
    baseUrl: 'http://192.168.0.1',
    username: '2',
    password: '3',
    autoSetup: false
}

describe('constructor', () => {

  it('throws on wrong parms', () => {
    // no config
    expect((done) => {
      const xapi = new Xapi();
      xapi.on('error', (err) => {
        expect(err.message).toEqual('No config supplied');
        done();
      })
    });
    // only url
    expect((done) => {
      const xapi = new Xapi({baseUrl:'fea'});
      xapi.on('error', (err) => {
        expect(err.message).toEqual('No config supplied');
        done();
      })
    });
    // missing password
    expect((done) => {
      const xapi = new Xapi({baseUrl:'fea', username: 'ae'});
      xapi.on('error', (err) => {
        expect(err.message).toEqual('No config supplied');
        done();
      })
    });
    // missing username
    expect((done) => {
      const xapi = new Xapi({baseUrl:'fea', password: 'ae'});
      xapi.on('error', (err) => {
        expect(err.message).toEqual('No config supplied');
        done();
      })
    });
  });

});

describe('query', () => {
  afterEach( () => {
    nock.cleanAll();
  });

  it('promise: should return result property of body', (done) => {
    const result = { advanced: true };
    nock(params.baseUrl)
      .post('/remote/json-rpc')
      .reply(200, {id: 4, result, jsonrpc: '2.0'});

    const xapi = new Xapi(params);
    xapi.query('faf')
      .then((res) => {
        expect(res).toEqual(result);
        done();
      });
  });

  it('promise: should return error on error', (done) => {
    nock(params.baseUrl)
      .post('/remote/json-rpc')
      .replyWithError('something awful happened');

    const xapi = new Xapi(params);
    xapi.query('faf')
      .catch( (err) => {
        expect(err.message).toBe('something awful happened');
        done();
      });

  });

  it('callback: should return result property of body', (done) => {
    const result = { advanced: true };
    nock(params.baseUrl)
      .post('/remote/json-rpc')
      .reply(200, {id: 4, result, jsonrpc: '2.0'});

    const xapi = new Xapi(params);
    xapi.query('faf', [''], (err, res) => {
      expect(res).toEqual(result);
      expect(err).toBeNull();
      done();
    });

  });

  it('callback: should return error on error', (done) => {
    nock(params.baseUrl)
      .post('/remote/json-rpc')
      .replyWithError('something awful happened');

    const xapi = new Xapi(params);
    xapi.query('faf', [''], (err, res) => {
      expect(err.message).toBe('something awful happened');
      expect(res).toBeUndefined();
      done();
    });

  });

  it('should handle failed method call as error', (done) => {
    const exampleErr = {
      message: 'JSONArray[2] not found.',
      code: -32001
    }
    const errMsg = 'No result, verify method and params';

    nock(params.baseUrl)
      .post('/remote/json-rpc')
      .reply(200, {id: 4, error: exampleErr, jsonrpc: '2.0'})
      .post('/remote/json-rpc')
      .reply(200, {id: 4, jsonrpc: '2.0'});

    const xapi = new Xapi(params);
    // promise style
    xapi.query('faf')
      .catch( (error) => {
        expect(error).toEqual(exampleErr);
        done();
      });

    xapi.query('faf')
      .catch( (error) => {
        expect(error).toBe(errMsg);
        done();
      });

  });

  it('should handle unsuported method call as error', (done) => {
    const errMsg = 'unsupported method called';

    nock(params.baseUrl)
      .post('/remote/json-rpc')
      .reply(200, {id: 4, result: errMsg, jsonrpc: '2.0'})

    const xapi = new Xapi(params);

    xapi.query('faf')
      .catch( (error) => {
        expect(error).toEqual('Unsupported method called');
        done();
      });

  });

  it('should log in first if 401 response code', (done) => {
    const result = { advanced: true };
    const sessionId = '1234End';
    nock(params.baseUrl)
      .post('/remote/json-rpc')
      .reply(401)
      .post('/system/http/login')
      .reply(200, {}, {
        'set-cookie': ['JSESSIONID=' + sessionId + '; Path=/; HttpOnly']
      })
      .post('/remote/json-rpc')
      .reply(200, {id: 4, result, jsonrpc: '2.0'});

    const xapi = new Xapi(params);
    xapi.query('faf')
      .then((res) => {
        expect(xapi.sessionId).toEqual(sessionId);
        expect(res).toEqual(result);
        done();
      });
  });

  it('should reject when no error and statusCode not 200', (done) => {
    const errMsg = 'Unknown error occured';

    nock(params.baseUrl)
      .post('/remote/json-rpc')
      .reply(400, {id: 4, result: errMsg, jsonrpc: '2.0'})

    const xapi = new Xapi(params);
    // promise style
    xapi.query('faf')
      .catch( (error) => {
        expect(error).toEqual(errMsg);
        done();
      });

  });

});
