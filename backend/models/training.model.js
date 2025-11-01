class Training {
  static async create(data) {
    return { _id: 'mock-training', ...data };
  }

  static async findOne() {
    return null;
  }

  static async findOneAndUpdate() {
    return null;
  }

  static async findOneAndDelete() {
    return null;
  }
}

export default Training;
