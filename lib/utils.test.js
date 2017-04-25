import utils from './utils';
import path from 'path';
import fs from 'fs'; // Mock

jest.mock('fs');

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

describe('readJsonFile', () => {

  it('should reject with error when read failed', (done) => {
    const errToThrow = new Error('read failed');
    fs.readFile.mockImplementationOnce( (path, encoding, cb) => {
        cb(errToThrow, null);
    });

    utils.readJsonFile('./kearti.json')
      .catch( (err) => {
        expect(err).toEqual(errToThrow);
        done();
      });
  });

  it('should reject when JSON string not valid', (done) => {
    fs.readFile.mockImplementationOnce( (path, encoding, cb) => {
        cb(null, '{ t<-: 2 }');
    });

    utils.readJsonFile('./Na.json')
      .catch( (err) => {
        expect(err.message.includes('Unexpected token t')).toBe(true);
        done();
      });
  });

  it('should use correct path to file', (done) => {
    // Clear mock
    fs.readFile.mockClear();

    fs.readFile.mockImplementationOnce( (path, encoding, cb) => {
        cb('notimportantnow', null);
    });

    utils.readJsonFile('./awsome.json')
      .catch( (err) => {
        expect(fs.readFile.mock.calls[0][0])
        .toBe(path.join(process.cwd(), './awsome.json'));

        done();
      });
  });

  it('should resolve with object when ok', (done) => {
    // Clear mock
    fs.readFile.mockClear();

    const jsonObj = '{ "test": "verified" }';

    fs.readFile.mockImplementationOnce( (path, encoding, cb) => {
        cb(null, jsonObj);
    });

    utils.readJsonFile('./allgood.json')
      .then( (returnedObj) => {
        expect(returnedObj).toEqual({
          test: 'verified'
        });
        done();
      });
  });
  
});

describe('checkIfDeviceExists', () => {
  const mockX = {
    deviceMap: new Map()
  }

  // Insert failing fake device
  mockX.deviceMap.set('dev', {
    zoneId: 'bafe',
    id: 'aefafe',
    type: 'notDimActuator'
  });

  const dev1 = {
    zoneId: 'bafe',
    id: 'aefafe',
    type: 'DimActuator'
  }

  // Insert correct fake device
  mockX.deviceMap.set('dev1', dev1);

  it('should reject when device name is not a string', (done) => {
      utils.checkIfDeviceExists.call(mockX, 2)
        .catch( (reason) => {
          expect(reason).toBe('Device name must be of type string');
          done();
        });
  });

  it('should reject when device dont exist', (done) => {
      utils.checkIfDeviceExists.call(mockX, 'na')
        .catch( (reason) => {
          expect(reason).toBe('No device with that name exists');
          done();
        });
  });

  it('should reject when device type not correct', (done) => {
      utils.checkIfDeviceExists.call(mockX, 'dev', 'DimActuator')
        .catch( (reason) => {
          expect(reason).toBe('No DimActuator with that name exists');
          done();
        });
  });

  it('should resolve with device props if dev exists and no type passed in', (done) => {
      utils.checkIfDeviceExists.call(mockX, 'dev1')
        .then( (devFields) => {
          expect(devFields).toEqual(dev1);
          done();
        });
  });

  it('should resolve with device props when device type is correct', (done) => {
      utils.checkIfDeviceExists.call(mockX, 'dev1', 'DimActuator')
        .then( (devFields) => {
          expect(devFields).toEqual(dev1);
          done();
        });
  });

});
