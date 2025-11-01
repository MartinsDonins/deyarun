class Route {
  static async find() {
    return [];
  }

  static async create(data) {
    return { _id: 'mock-route', ...data };
  }
}

export default Route;
