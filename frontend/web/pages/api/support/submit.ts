import { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '../../../lib/productionLogger'

// GDPR-compliant IP anonymization utility
const anonymizeIP = (ip: string | string[]): string => {
  if (!ip) return 'unknown';
  
  // Handle array case (x-forwarded-for can be array)
  const ipAddress = Array.isArray(ip) ? ip[0] : ip;
  
  // IPv4 anonymization (remove last octet)
  if (ipAddress.includes('.')) {
    const parts = ipAddress.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  
  // IPv6 anonymization (remove last 64 bits)
  if (ipAddress.includes(':')) {
    const lastColonIndex = ipAddress.lastIndexOf(':');
    if (lastColonIndex > 0) {
      return ipAddress.substring(0, lastColonIndex) + ':0000';
    }
  }
  
  return 'unknown';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { name, email, subject, message, type = 'support' } = req.body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Visi lauki ir obligāti' 
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nepareizs e-pasta formāts' 
      })
    }

    // Send to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
    
    const response = await fetch(`${backendUrl}/api/support/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        subject,
        message,
        type,
        source: 'web',
        userAgent: req.headers['user-agent'],
        ip: anonymizeIP(req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '')
      })
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()

    return res.status(200).json({
      success: true,
      message: 'Ziņojums sekmīgi nosūtīts! Mēs sazināsimies ar jums 24 stundu laikā.',
      ticketId: data.ticketId
    })

  } catch (error) {
    logger.error('ERROR', 'Support submission error:', { error: error })
    
    return res.status(500).json({
      success: false,
      message: 'Radās kļūda nosūtot ziņojumu. Lūdzu mēģiniet vēlāk.'
    })
  }
}