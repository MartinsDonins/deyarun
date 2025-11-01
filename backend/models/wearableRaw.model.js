export default class WearableRaw {
  constructor(data = {}) {
    this.user = data.user;
    this.deviceType = data.deviceType;
    this.dataType = data.dataType;
    this.rawPayload = data.rawPayload || {};
  }
}
