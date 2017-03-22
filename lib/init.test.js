import nock from 'nock';
import init from './init';

const getZoneXMock = {
  query: () => {},
  deviceMap: new Map(),
  sceneMap: new Map()
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

    getZoneXMock.query = jest.fn( () => Promise.resolve(deviceArray) );

    init.getZoneDevices.call(getZoneXMock, zoneId)
    .then( () => {
      // Should call query with correct method and params
      expect(getZoneXMock.query.mock.calls.length).toBe(1);
      expect(getZoneXMock.query.mock.calls[0][0])
        .toBe('StatusControlFunction/getDevices');
      expect(getZoneXMock.query.mock.calls[0][1])
        .toEqual([zoneId, '']);

      // Should fill deviceMap
      expect(getZoneXMock.deviceMap.get('srgsg')).toEqual({
        zoneId,
        id: deviceArray[0].id,
        type: deviceArray[0].type,
        value: deviceArray[0].value
      });
      expect(getZoneXMock.deviceMap.get('sgsr gord')).toEqual({
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

    getZoneXMock.query = jest.fn( () => Promise.resolve(sceneArray) );

    init.getZoneScenes.call(getZoneXMock, zoneId)
    .then( () => {
      // Should call query with correct method and params
      expect(getZoneXMock.query.mock.calls.length).toBe(1);
      expect(getZoneXMock.query.mock.calls[0][0])
        .toBe('SceneFunction/getScenes');
      expect(getZoneXMock.query.mock.calls[0][1])
        .toEqual([zoneId, '']);

      // Should fill sceneMap
      expect(getZoneXMock.sceneMap.get('allelysav')).toEqual({
        zoneId,
        id: sceneArray[0].id
      });
      // Only one scene is enabled and should be added
      expect(getZoneXMock.sceneMap.size).toBe(1);
      
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
