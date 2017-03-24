import nock from 'nock';
import Xapi from './Xcomfort';
import Promise from 'bluebird';

const params = {
    baseUrl: 'http://192.168.0.1',
    username: '2',
    password: '3',
    autoSetup: false
}

describe('constructor', () => {

  it('throws on missing parms', () => {
    // no config
    expect( () => {
      const xapi = new Xapi();
    }).toThrow(new Error('No baseUrl supplied'));

    // only url
    expect( () => {
      const xapi = new Xapi({baseUrl:'fea'});
    }).toThrow(new Error('No username supplied'));

    // missing password
    expect( () => {
      const xapi = new Xapi({baseUrl:'fea', username: 'ae'});
    }).toThrow(new Error('No password supplied'));

    // missing username
    expect( () => {
      const xapi = new Xapi({baseUrl:'fea', password: 'ae'});
    }).toThrow(new Error('No username supplied'));

  });

  it('sets supplied params internally', () => {
    const xapi = new Xapi(params);
    expect(xapi.baseUrl).toBe(params.baseUrl);
    expect(xapi.username).toBe(params.username);
    expect(xapi.password).toBe(params.password);
  });

});

describe('login', () => {
  afterEach( () => {
    nock.cleanAll();
  });

  it('should log in correctly', (done) => {
    const sessionId = '1234End';
    nock(params.baseUrl)
      .post('/system/http/login', (body) => {
        // Should use correct form structure and correct credentials
        expect(body.u).toBe(params.username);
        expect(body.p).toBe(params.password);
        expect(body.referer).toBe('/bcgui/index.html');
        return true;
      })
      .reply(200, {}, {
        'set-cookie': ['JSESSIONID=' + sessionId + '; Path=/; HttpOnly']
      });

    const xapi = new Xapi(params);
    xapi.login()
      .then(() => {
        // Session Id should be stored in instance
        expect(xapi.sessionId).toEqual(sessionId);
        done();
      });
  });

  it('should reject on error', (done) => {
    nock(params.baseUrl)
      .post('/system/http/login')
      .replyWithError('Failed hard');

    const xapi = new Xapi(params);
    xapi.login()
      .catch( (err) => {
        expect(err.message).toBe('Failed hard');
        done();
      });
  });

  it('should reject on wrong credentials', (done) => {
    nock(params.baseUrl)
      .post('/system/http/login')
      .reply(403);

    const xapi = new Xapi(params);
    xapi.login()
      .catch( (err) => {
        expect(err.message).toBe('Wrong username or password');
        done();
      });
  });

  it('should reject on other than 200 statusCode', (done) => {
    nock(params.baseUrl)
      .post('/system/http/login')
      .reply(400);

    const xapi = new Xapi(params);
    xapi.login()
      .catch( (err) => {
        expect(err.message).toBe('Login failed');
        done();
      });

    });

});

describe('error', () => {
  it('should emit error object', () => {
    const xapi = new Xapi(params);
    xapi.emit = jest.fn();
    xapi._error('test');
    expect(xapi.emit.mock.calls.length).toBe(1);
    expect(xapi.emit.mock.calls[0][0]).toBe('error');
    expect(xapi.emit.mock.calls[0][1]).toEqual(new Error('test'));
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

describe('setDimState', () => {
  const xapi = new Xapi(params);
  const mockX = {
    query:  jest.fn(),
    deviceMap: new Map()
  }

  // Insert failing fake device
  mockX.deviceMap.set('dev', {
    zoneId: 'bafe',
    id: 'aefafe',
    type: 'notDimActuator'
  })

  // Insert correct fake device
  mockX.deviceMap.set('dev1', {
    zoneId: 'bafe',
    id: 'aefafe',
    type: 'DimActuator'
  })

  const setDimState = xapi.setDimState.bind(mockX);

  it('should reject when device dont exist', (done) => {
      setDimState('na','on')
        .catch( (reason) => {
          expect(reason).toBe('No device with name that exists');
          // query should not be called
          expect(mockX.query.mock.calls.length).toBe(0);
          done();
        });
  });

  it('should emit error and return when device type not DimActuator', (done) => {
      // New mocks
      mockX.query = jest.fn();

      setDimState('dev','on')
        .catch( (reason) => {
          expect(reason).toBe('No dimmable device with name that exists');

          // Test that callback also works on rejection
          setDimState('dev','on', (err) => {
            expect(err).toBe('No dimmable device with name that exists');
            // query should not be called
            expect(mockX.query.mock.calls.length).toBe(0);
            done();
          });
        });
  });

  it('should emit error and return when state value not valid', (done) => {
      // New mocks
      mockX.query = jest.fn();
      mockX._error = jest.fn();

      const errString = 'State value not valid (on/off or 0-100 integer)';

      // -1 outside lower range
      setDimState('dev1',-1)
        .catch( (err1) => {
          expect(err1).toBe(errString);
          // 101 outside upper range
          setDimState('dev1',101)
            .catch( (err2) => {
              expect(err2).toBe(errString);
              // string numbers not valid
              setDimState('dev1','20', (err3) => {
                expect(err3).toBe(errString);
                // not 'on' or 'off' is not valid
                setDimState('dev1','onn', (err4) => {
                  expect(err4).toBe(errString);

                  // query should not be called
                  expect(mockX.query.mock.calls.length).toBe(0);
                  done();
                });
              });
            });
        });


  });

  it('should return true if status ok', (done) => {
    // New mocks
    mockX.query = jest.fn( () => Promise.resolve({ status: 'ok' }));

    setDimState('dev1', 'off')
      .then( (status1) => {
        expect(status1).toBe(true);

        expect(mockX.query.mock.calls[0][0])
          .toBe('StatusControlFunction/controlDevice');
        expect(mockX.query.mock.calls[0][1])
          .toEqual(['bafe', 'aefafe', 'off']);

        setDimState('dev1', 20, (err, status2) => {
          expect(status2).toBe(true);
          expect(err).toBe(null);
          done();
        })
      });
  });

  it('should return false if no status ok', (done) => {
    // New mocks
    mockX.query = jest.fn( () => Promise.resolve({}));

    setDimState('dev1', 'on')
      .then( (status) => {
        expect(status).toBe(false);
        done();
      });
  });

});

describe('getDeviceNames', () => {
  it('should return array with device name strings', () => {
    const xapi = new Xapi(params);
    xapi.deviceMap.set('one', 1);
    xapi.deviceMap.set('two', 2);
    xapi.deviceMap.set('three', 3);
    expect(xapi.getDeviceNames()).toEqual(['one','two','three']);
  });
});

describe('getSceneNames', () => {
  it('should return array with scene name strings', () => {
    const xapi = new Xapi(params);
    xapi.sceneMap.set('one', 1);
    xapi.sceneMap.set('two', 2);
    xapi.sceneMap.set('three', 3);
    expect(xapi.getSceneNames()).toEqual(['one','two','three']);
  });
});

describe('getNameObject', () => {
  it('should return object with device and scene name arrays', () => {
    const xapi = new Xapi(params);
    xapi.deviceMap.set('one', 1);
    xapi.deviceMap.set('two', 2);
    xapi.deviceMap.set('three', 3);

    xapi.sceneMap.set('four', 4);
    xapi.sceneMap.set('five', 5);
    xapi.sceneMap.set('six', 6);

    expect(xapi.getNameObject()).toEqual({
      devices: ['one', 'two', 'three'],
      scenes: ['four', 'five', 'six']
    });
  });
});
