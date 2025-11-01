import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VersionReader {
  constructor() {
    this.projectRoot = this.determineProjectRoot();
    this.versions = {};
    this.lastUpdated = null;
  }

  determineProjectRoot() {
    let projectRoot = path.resolve(__dirname, '../..');

    if (process.cwd().includes('/app') && __dirname.includes('/app')) {
      const backendPackagePath = path.resolve(__dirname, '../package.json');
      if (fs.existsSync(backendPackagePath)) {
        projectRoot = path.resolve(__dirname, '..');
      } else {
        projectRoot = process.cwd();
      }
    }

    return projectRoot;
  }

  resolve(relativePath) {
    return path.resolve(this.projectRoot, relativePath);
  }

  readVersionFromPackage(packagePath) {
    try {
      const fullPath = this.resolve(packagePath);
      if (fs.existsSync(fullPath)) {
        const packageData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        return packageData.version || 'unknown';
      }
    } catch (error) {
      console.warn(`⚠️  VersionReader: Could not read version from ${packagePath}: ${error.message}`);
    }
    return 'unknown';
  }

  readVersionFromGradle(gradlePath) {
    const fullPath = this.resolve(gradlePath);
    if (!fs.existsSync(fullPath)) {
      return 'unknown';
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const match = content.match(/versionName\s*=\s*"([^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    } catch (error) {
      console.warn(`⚠️  VersionReader: Could not parse Gradle file ${gradlePath}: ${error.message}`);
    }

    return 'unknown';
  }

  readAllVersions() {
    const inDocker = process.cwd().includes('/app');

    const backendPath = inDocker ? 'package.json' : 'backend/package.json';
    const frontendPath = inDocker ? '../frontend/web/package.json' : 'frontend/web/package.json';
    const mobileGradlePath = inDocker
      ? '../frontend/Mobile/app/build.gradle.kts'
      : 'frontend/Mobile/app/build.gradle.kts';
    const legacyMobilePackage = inDocker
      ? '../frontend/archive/mobile_legacy/package.json'
      : 'frontend/archive/mobile_legacy/package.json';

    const backendVersion = this.readVersionFromPackage(backendPath);
    const frontendVersion = this.readVersionFromPackage(frontendPath);

    let mobileVersion = this.readVersionFromGradle(mobileGradlePath);
    if (mobileVersion === 'unknown') {
      mobileVersion = this.readVersionFromPackage(legacyMobilePackage);
    }

    const versions = {
      backend: backendVersion,
      frontend: frontendVersion,
      mobile: mobileVersion,
      timestamp: new Date().toISOString()
    };

    if (inDocker) {
      if (versions.frontend === 'unknown') {
        versions.frontend = backendVersion;
      }
      if (versions.mobile === 'unknown') {
        versions.mobile = backendVersion;
      }
    }

    this.versions = versions;
    this.lastUpdated = new Date();

    return versions;
  }

  getVersions(maxAgeMs = 5 * 60 * 1000) {
    const now = new Date();
    const cacheAge = this.lastUpdated ? now - this.lastUpdated : Infinity;

    if (!this.lastUpdated || cacheAge > maxAgeMs) {
      return this.readAllVersions();
    }

    return this.versions;
  }

  refreshVersions() {
    return this.readAllVersions();
  }

  getVersion(component) {
    const versions = this.getVersions();
    return versions[component] || 'unknown';
  }

  areVersionsInSync() {
    const versions = this.getVersions();
    const versionValues = [versions.backend, versions.frontend, versions.mobile];
    const uniqueVersions = [...new Set(versionValues.filter(v => v !== 'unknown'))];
    return uniqueVersions.length <= 1;
  }

  getVersionSyncStatus() {
    const versions = this.getVersions();
    const inSync = this.areVersionsInSync();

    return {
      inSync,
      versions,
      message: inSync ? 'All components are in sync' : 'Version mismatch detected between components'
    };
  }
}

const versionReader = new VersionReader();
export default versionReader;
export { VersionReader };
