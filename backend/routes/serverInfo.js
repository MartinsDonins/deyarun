import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import os from 'os';

const router = express.Router();

// Admin middleware for all server info routes
router.use(requireAdmin);

// Get server network information
router.get('/network', async (req, res) => {
  try {
    const networkInterfaces = os.networkInterfaces();
    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      networkInterfaces: {}
    };

    // Filter and format network interfaces
    Object.keys(networkInterfaces).forEach(interfaceName => {
      const addresses = networkInterfaces[interfaceName];
      if (addresses) {
        serverInfo.networkInterfaces[interfaceName] = addresses
          .filter(addr => !addr.internal) // Only external interfaces
          .map(addr => ({
            address: addr.address,
            family: addr.family,
            netmask: addr.netmask,
            mac: addr.mac
          }));
      }
    });

    // Get primary IP addresses (both internal and external)
    const primaryIPs = {
      ipv4: [],
      ipv6: [],
      internal: {
        ipv4: [],
        ipv6: []
      }
    };

    Object.values(networkInterfaces).forEach(addresses => {
      if (addresses) {
        addresses.forEach(addr => {
          if (addr.internal) {
            // Internal/local IPs
            if (addr.family === 'IPv4') {
              primaryIPs.internal.ipv4.push(addr.address);
            } else if (addr.family === 'IPv6') {
              primaryIPs.internal.ipv6.push(addr.address);
            }
          } else {
            // External IPs
            if (addr.family === 'IPv4') {
              primaryIPs.ipv4.push(addr.address);
            } else if (addr.family === 'IPv6') {
              primaryIPs.ipv6.push(addr.address);
            }
          }
        });
      }
    });

    // Try to get public IP address using axios
    let publicIP = null;
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
      if (response.data && response.data.ip) {
        publicIP = response.data.ip;
      }
    } catch (ipError) {
      console.log('Could not fetch public IP:', ipError.message);
    }

    res.json({
      success: true,
      data: {
        ...serverInfo,
        primaryIPs,
        publicIP,
        coolifyRecommendation: {
          message: 'Konfigurējiet Coolify API, lai pieņemtu pieprasījumus tikai no šīm IP adresēm',
          ipv4Addresses: primaryIPs.ipv4,
          ipv6Addresses: primaryIPs.ipv6,
          internalIPv4: primaryIPs.internal.ipv4,
          internalIPv6: primaryIPs.internal.ipv6,
          publicIP,
          securityNote: 'Pievienojiet šīs IP adreses Coolify API whitelist iestatījumos maksimālai drošībai'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting server network info:', error);
    res.status(500).json({
      success: false,
      message: 'Neizdevās iegūt servera tīkla informāciju',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get simplified IP info for quick reference
router.get('/ip', async (req, res) => {
  try {
    const networkInterfaces = os.networkInterfaces();
    const ips = {
      ipv4: [],
      ipv6: [],
      internal: {
        ipv4: [],
        ipv6: []
      }
    };

    // Get both external and internal IPs
    Object.values(networkInterfaces).forEach(addresses => {
      if (addresses) {
        addresses.forEach(addr => {
          if (addr.internal) {
            // Internal/local IPs
            if (addr.family === 'IPv4') {
              ips.internal.ipv4.push(addr.address);
            } else if (addr.family === 'IPv6') {
              ips.internal.ipv6.push(addr.address);
            }
          } else {
            // External IPs
            if (addr.family === 'IPv4') {
              ips.ipv4.push(addr.address);
            } else if (addr.family === 'IPv6') {
              ips.ipv6.push(addr.address);
            }
          }
        });
      }
    });

    // Try to get public IP address using axios
    let publicIP = null;
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
      if (response.data && response.data.ip) {
        publicIP = response.data.ip;
      }
    } catch (ipError) {
      console.log('Could not fetch public IP:', ipError.message);
    }

    res.json({
      success: true,
      data: {
        hostname: os.hostname(),
        primaryIPs: ips,
        publicIP,
        coolifyWhitelist: ips.ipv4.concat(ips.ipv6),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting server IP info:', error);
    res.status(500).json({
      success: false,
      message: 'Neizdevās iegūt servera IP informāciju',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;