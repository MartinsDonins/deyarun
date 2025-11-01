// API endpoint to set auth token as httpOnly cookie
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    // Set httpOnly cookie with secure settings
    res.setHeader('Set-Cookie', [
      `auth_token=${token}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Path=/; Max-Age=86400`
    ])

    return res.status(200).json({ success: true })

  } catch (error) {
    console.error('Set cookie error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}