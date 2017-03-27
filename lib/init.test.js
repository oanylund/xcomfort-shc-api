import nock from 'nock';
import init from './init';
import utils from './utils'; // Mock

jest.mock('./utils');

const Xmock = {
  query: () => {},
  deviceMap: new Map(),
  sceneMap: new Map(),
  emit: jest.fn()
}

describe('getZoneDevices', () => {
  const deviceArray = [
    {
      "id": "xCo:25250_u0",
      "unit": "%",
      "name": "srgsg ",
      "value": "0",
      "display": true,
      "operations": [
        "value"
      ],
      "type": "DimActuator",
      "sequenceNumber": 0
    },
    {
      "id": "xCo:5624257_u0",
      "unit": "%",
      "name": "Sgsr gord ",
      "value": "0",
      "display": true,
      "operations": [
        "value"
      ],
      "type": "DimActuator",
      "sequenceNumber": 1
    }
  ];
  const zoneId = 'hz_1';

  it('should call query and fill deviceMap', (done) => {

    Xmock.query = jest.fn( () => Promise.resolve(deviceArray) );

    init.getZoneDevices.call(Xmock, zoneId)
    .then( () => {
      // Should call query with correct method and params
      expect(Xmock.query.mock.calls.length).toBe(1);
      expect(Xmock.query.mock.calls[0][0])
        .toBe('StatusControlFunction/getDevices');
      expect(Xmock.query.mock.calls[0][1])
        .toEqual([zoneId, '']);

      // Should fill deviceMap
      expect(Xmock.deviceMap.get('srgsg')).toEqual({
        zoneId,
        id: deviceArray[0].id,
        type: deviceArray[0].type,
        value: deviceArray[0].value
      });
      expect(Xmock.deviceMap.get('sgsr gord')).toEqual({
        zoneId,
        id: deviceArray[1].id,
        type: deviceArray[1].type,
        value: deviceArray[1].value
      });
      done();
    });

  });

});

describe('getZoneScenes', () => {
  const sceneArray = [
    {
      "id": "MA1",
      "enabled": true,
      "name": "AlleLysAv",
      "editable": true,
      "sceneIcon": "House-Bed-Night",
      "mainDashboard": true
    },
    {
      "id": "MA2",
      "enabled": false,
      "name": "Stemning-Spisebord",
      "editable": true,
      "sceneIcon": "Wine",
      "mainDashboard": true
    }
  ];
  const zoneId = 'hz_1';

  it('should call query and fill sceneMap', (done) => {

    Xmock.query = jest.fn( () => Promise.resolve(sceneArray) );

    init.getZoneScenes.call(Xmock, zoneId)
    .then( () => {
      // Should call query with correct method and params
      expect(Xmock.query.mock.calls.length).toBe(1);
      expect(Xmock.query.mock.calls[0][0])
        .toBe('SceneFunction/getScenes');
      expect(Xmock.query.mock.calls[0][1])
        .toEqual([zoneId, '']);

      // Should fill sceneMap
      expect(Xmock.sceneMap.get('allelysav')).toEqual({
        zoneId,
        id: sceneArray[0].id
      });
      // Only one scene is enabled and should be added
      expect(Xmock.sceneMap.size).toBe(1);

      done();
    });

  });

});

// Needs to run last because it mutates getZoneDevices and getZoneScenes
describe('initialSetup', () => {
  it('should login,autoconfigure and emit ready', (done) => {
    const zoneArr = [{zoneId: 'hz_1'}, {zoneId: 'hz_2'}];
    const mockXapi = {
      query: jest.fn( () => Promise.resolve(zoneArr) ),
      // query: (w) => console.log('feaf',w),
      login: jest.fn( () => Promise.resolve() ),
      emit: (ev) => {
        // Should login first and just once
        expect(mockXapi.login.mock.calls.length).toBe(1);

        // Should call query with 'HFM/getZones',[] and only once
        expect(mockXapi.query.mock.calls[0][0]).toBe('HFM/getZones');
        expect(mockXapi.query.mock.calls[0][1]).toEqual([]);
        expect(mockXapi.query.mock.calls.length).toBe(1);

        // Should call getZoneDevices and getZoneScenes for each zone
        expect(init.getZoneDevices.mock.calls.length).toBe(2);
        expect(init.getZoneScenes.mock.calls.length).toBe(2);
        expect(init.getZoneDevices.mock.calls).toEqual([['hz_1'],['hz_2']]);
        expect(init.getZoneScenes.mock.calls).toEqual([['hz_1'],['hz_2']]);

        // Should emit ready event when done
        expect(ev).toBe('ready');

        done();
      }
    }

    // Mutate get functions
    init.getZoneDevices = jest.fn( (zone) => Promise.resolve(zone) );
    init.getZoneScenes = jest.fn( (zone) => Promise.resolve(zone) );

    init.initialSetup.call(mockXapi);

  });

  it('Should emit error', (done) => {
    const err = new Error('grusome');
    const mockXapi = {
      login: jest.fn( () => Promise.reject(err)),
      emit: (ev, error) => {
        expect(ev).toBe('error');
        expect(error).toEqual(err);
        done();
      }
    }

    init.initialSetup.call(mockXapi);
  });
});

describe('importSetup', () => {

  it('should throw when path is not a string', () => {
    expect( () => {
      init.importSetup(123);
    }).toThrow(new Error('importPath is not a string'));
  });

  it('should emit error when reading fails', (done) => {
    const readErr = new Error('Reading error');

    Xmock.emit = (ev, error) => {
      expect(ev).toBe('error');
      expect(error).toEqual(readErr);
      done();
    }

    utils.readJsonFile
      .mockImplementationOnce( () => Promise.reject(readErr) );

    init.importSetup.call(Xmock, './setup.json');

  });

  it('should emit error when parsed object has no devices property', (done) => {
    const deviceErr = new Error('Parsed object is missing devices property');

    Xmock.emit = (ev, error) => {
      expect(ev).toBe('error');
      expect(error).toEqual(deviceErr);
      done();
    }

    utils.readJsonFile
      .mockImplementationOnce( () => Promise.resolve({
        dev: '123',
        scenes: [['sc', {}]]
      }));

    init.importSetup.call(Xmock, './setup.json');

  });

  it('should emit error when parsed object has no scenes property', (done) => {
    const sceneErr = new Error('Parsed object is missing scenes property');

    Xmock.emit = (ev, error) => {
      expect(ev).toBe('error');
      expect(error).toEqual(sceneErr);
      done();
    }

    utils.readJsonFile
      .mockImplementationOnce( () => Promise.resolve({
        devices: '123',
        scene2: [['sc', {}]]
      }));

    init.importSetup.call(Xmock, './setup.json');

  });

  it('should create maps when ok, and emit ready event', (done) => {
    const fakeSetup = {
      devices: [
        ['one', 12],
        ['two', 123]
      ],
      scenes: [
        ['three', 1234],
        ['four', 12345]
      ]
    }

    Xmock.emit = (ev, error) => {
      expect(ev).toBe('ready');
      expect([...Xmock.deviceMap]).toEqual(fakeSetup.devices);
      expect([...Xmock.sceneMap]).toEqual(fakeSetup.scenes);
      expect(utils.readJsonFile.mock.calls[0][0]).toBe('./setup.json');
      done();
    }

    utils.readJsonFile
      .mockImplementationOnce( () => Promise.resolve(fakeSetup));

    init.importSetup.call(Xmock, './setup.json');

  });

});
