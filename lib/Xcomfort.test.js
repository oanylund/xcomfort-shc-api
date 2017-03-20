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

  it('should return result property', (done) => {
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

  it('should log in first if 401 response code', (done) => {
    const result = { advanced: true };
    nock(params.baseUrl)
      .post('/remote/json-rpc')
      .reply(401)
      .post('/system/http/login')
      .reply(200, {}, {
        'set-cookie': ['JSESSIONID=1234End; Path=/; HttpOnly']
      })
      .post('/remote/json-rpc')
      .reply(200, {id: 4, result, jsonrpc: '2.0'});

    const xapi = new Xapi(params);
    xapi.query('faf')
      .then((res) => {
        expect(res).toEqual(result);
        done();
      });
  });
});
