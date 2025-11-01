// API endpoint to verify authentication via httpOnly cookie
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get auth token from httpOnly cookie
    const authToken = req.cookies.auth_token

    if (!authToken) {
      return res.status(401).json({ error: 'No auth token found' })
    }

    // Verify token with backend API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
    
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const userData = await response.json()
      return res.status(200).json({ valid: true, user: userData })
    } else {
      return res.status(401).json({ error: 'Invalid token' })
    }

  } catch (error) {
    console.error('Auth verification error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}