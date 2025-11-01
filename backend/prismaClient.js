// PostgreSQL/Prisma support has been removed for production stability
// All data is now stored in MongoDB
// This file exists only to prevent import errors during transition

console.warn('⚠️  WARNING: PostgreSQL/Prisma has been removed. Use MongoDB models instead.');

// Export a mock object that throws errors when used
const mockPrisma = new Proxy({}, {
  get(target, prop) {
    throw new Error(`PostgreSQL/Prisma has been removed. Use MongoDB models instead of prisma.${prop}`);
  }
});

export default mockPrisma;