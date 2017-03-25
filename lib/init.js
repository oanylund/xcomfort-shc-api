const init = module.exports;

/**
 * Ready event gets emitted when autosetup is complete
 * @event ready
 * @memberof module:Xcomfort#
 */

/**
 * Runs on initialisation. Logs in, then fetches devices and scenes from SHC
 * @emits module:Xcomfort#ready
 * @alias module:Xcomfort~initialSetup
 */
init.initialSetup = function () {
  this.login()
    .then( () => this.query('HFM/getZones', []) )
    .then( (zoneArray) => {
        let promiseArray = [];
        zoneArray.forEach( (zone, index, arr) => {
          promiseArray.push(init.getZoneDevices.call(this, zone.zoneId));
          promiseArray.push(init.getZoneScenes.call(this, zone.zoneId));
        });
        return Promise.all(promiseArray);
    })
    .then( () => this.emit('ready') )
    .catch( (err) => this.emit('error', err) );
}

/**
 * @typedef {object} deviceDetail
 * @prop {string} zoneId  - Zone id
 * @prop {string} id      - Device id
 * @prop {string} type    - SHC class type
 * @prop {string} value   - Device value
 * @memberof module:Xcomfort~
 */

 /**
  * Gets devices in zone from SHC and adds them to deviceMap with name
  * of device as key and value of type {@link module:Xcomfort~deviceDetail}
  * @param {string} zoneId - name of zone to get devices in
  * @returns {Promise} - with no value, only used to tell when its done
  * @alias module:Xcomfort~getZoneDevices
  */
init.getZoneDevices = function (zoneId) {
  return this.query('StatusControlFunction/getDevices', [zoneId, ''])
    .then( (devices) => {
        if(!devices) return;
        devices.forEach( (device) => {
          this.deviceMap.set(device.name.trim().toLowerCase(), {
            zoneId,
            id: device.id,
            type: device.type,
            value: device.value
          });
        });
    });
}

/**
 * @typedef {object} sceneDetail
 * @prop {string} zoneId - Zone id
 * @prop {string} id - Scene id
 * @memberof module:Xcomfort~
 */

 /**
  * Gets scenes in zone from SHC and adds them to sceneMap with name
  * of scene as key and value of type {@link module:Xcomfort~sceneDetail}
  * @param {string} zoneId - name of zone to get devices in
  * @returns {Promise} - with no value, only used to tell when its done
  * @alias module:Xcomfort~getZoneScenes
  */
init.getZoneScenes = function (zoneId) {
  return this.query('SceneFunction/getScenes', [zoneId, ''])
    .then( (scenes) => {
        if(!scenes) return;
        scenes.forEach( (scene) => {
          if(scene.enabled)
          this.sceneMap.set(scene.name.trim().toLowerCase(), {
            zoneId,
            id: scene.id
          });
        });
    });
}
