export default class GpsData {
  constructor(data = {}) {
    this.user = data.user;
    this.training = data.training;
    this.track = data.track || [];
  }
}
