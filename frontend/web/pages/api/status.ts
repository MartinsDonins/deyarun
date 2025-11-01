import { NextApiRequest, NextApiResponse } from 'next';

interface StatusResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: {
    name: string;
    version: string;
    environment: string;
    uptime: number;
  };
  checks: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
      responseTime?: number;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();
    
    // Basic health checks
    const checks: StatusResponse['checks'] = {
      system: {
        status: 'pass',
        message: 'System operational',
        responseTime: Date.now() - startTime
      },
      memory: {
        status: process.memoryUsage().heapUsed < 1024 * 1024 * 500 ? 'pass' : 'fail', // 500MB threshold
        message: `Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      environment: {
        status: process.env.NODE_ENV ? 'pass' : 'fail',
        message: `Environment: ${process.env.NODE_ENV || 'undefined'}`
      }
    };

    // Determine overall status
    const hasFailures = Object.values(checks).some(check => check.status === 'fail');
    const overallStatus: StatusResponse['status'] = hasFailures ? 'unhealthy' : 'healthy';

    const statusData: StatusResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: {
        name: 'deyarun-web',
        version: '1.17.43',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      },
      checks
    };

    const responseCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(responseCode).json(statusData);
  } catch (error) {
    res.status(500).json({ error: 'Status check failed' });
  }
}