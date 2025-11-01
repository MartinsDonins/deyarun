// API endpoint to logout and clear httpOnly cookie
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Clear the httpOnly cookie by setting it to expire immediately
    res.setHeader('Set-Cookie', [
      `auth_token=; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Path=/; Max-Age=0`
    ])

    return res.status(200).json({ success: true })

  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}