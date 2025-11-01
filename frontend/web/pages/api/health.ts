import { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthData: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'deyarun-web',
      version: '1.17.43',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
}