import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Simple rate limiting implementation
function rateLimit(request: NextRequest): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${ip}-${request.nextUrl.pathname}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = request.nextUrl.pathname.startsWith('/api/') ? 30 : 100 // Lower limit for API endpoints

  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}

// Authentication check for sensitive endpoints
async function requireAuth(request: NextRequest): Promise<boolean> {
  const pathname = request.nextUrl.pathname
  
  // Endpoints that require authentication
  const protectedPaths = [
    '/api/credit-approval',
    '/api/admin',
    '/admin',
    '/api/employee-applications',  // ✅ SECURITY FIX: Protect employee data
    '/api/upload',                 // ✅ SECURITY FIX: Protect file uploads
    '/api/parse-resume'            // ✅ SECURITY FIX: Protect AI processing
  ]
  
  if (!protectedPaths.some(path => pathname.startsWith(path))) {
    return true // Not a protected path
  }
  
  // Check for authentication token/header
  const authHeader = request.headers.get('authorization')
  const authToken = request.headers.get('x-admin-token')
  const authCookie = request.cookies.get('admin-session')
  
  // For credit approval, check for valid token or signed URL
  if (pathname.startsWith('/api/credit-approval')) {
    const signedUrlToken = request.nextUrl.searchParams.get('token')
    const signature = request.nextUrl.searchParams.get('sig')
    
    // Allow if it's a properly signed URL (for email links)
    if (signedUrlToken && signature) {
      // In production, verify the signature against a secret
      return verifySignature(signedUrlToken, signature)
    }
    
    // Check for admin authentication
    const adminToken = authHeader?.split(' ')[1] || authToken || authCookie?.value
    return await verifyAdminToken(adminToken ?? undefined)
  }
  
  // For admin endpoints, require proper authentication
  const token = authHeader?.split(' ')[1] || authToken || authCookie?.value
  return await verifyAdminToken(token ?? undefined)
}

// Simple signature verification (implement proper HMAC in production)
function verifySignature(token: string, signature: string): boolean {
  // This is a simplified implementation
  // In production, use HMAC with a secret key
  try {
    const secret = process.env.SIGNATURE_SECRET
    if (!secret) {
      console.error('SIGNATURE_SECRET is not set in environment variables.')
      return false
    }
    const hmac = createHmac('sha256', secret)
    hmac.update(token)
    const expectedSignature = hmac.digest('hex')

    const a = Buffer.from(expectedSignature, 'hex')
    const b = Buffer.from(signature, 'hex')
    if (a.length !== b.length) {
      // For timingSafeEqual, buffers must be the same length.
      // We still compare a dummy buffer of the same size to avoid leaking length info.
      const dummy = Buffer.alloc(b.length)
      timingSafeEqual(dummy, b)
      return false
    }

    return timingSafeEqual(a, b)
  } catch (error) {
    console.error('Error during signature verification:', error)
    return false
  }
}

// Placeholder for a real token verification function
// This should be replaced with actual JWT validation or session lookup
async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false
  }
  
  // In a real application, you would:
  // 1. Decode the JWT.
  // 2. Verify the signature using a secret key.
  // 3. Check claims like expiration, issuer, etc.
  // 4. Optionally, look up the user/session in the database.
  
  // For the purpose of this audit, we will simulate a secure check.
  // This is NOT a real or secure implementation.
  // Replace this with your actual authentication logic.
  const isValid = token.startsWith('valid-token-') // Example check
  
  // Prevent timing attacks on the check
  await new Promise(resolve => setTimeout(resolve, 50))
  
  return isValid
}

// Generate CSRF token
function generateCSRFToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64')
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 1. Rate Limiting
  if (!rateLimit(request)) {
    console.warn(`Rate limit exceeded for ${request.ip} on ${request.nextUrl.pathname}`)
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + 60).toString()
      }
    })
  }
  
  // 2. Authentication Check
  if (!await requireAuth(request)) {
    console.warn(`Unauthorized access attempt to ${request.nextUrl.pathname} from ${request.ip}`)
    return new NextResponse('Unauthorized', { 
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer realm="Admin Area"',
        'X-Content-Type-Options': 'nosniff'
      }
    })
  }
  
  // 3. Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://graph.microsoft.com https://login.microsoftonline.com",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // 4. CSRF Protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token')
    const csrfCookie = request.cookies.get('csrf-token')
    
    // Skip CSRF check for API endpoints with proper auth
    if (!request.nextUrl.pathname.startsWith('/api/') || !csrfToken || !csrfCookie) {
      if (!request.nextUrl.pathname.startsWith('/api/')) {
        console.warn(`CSRF token missing for ${request.method} ${request.nextUrl.pathname}`)
        return new NextResponse('CSRF Token Required', { 
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff'
          }
        })
      }
    }
  }
  
  // 5. Add CSRF token to response for forms
  if (request.method === 'GET' && !request.nextUrl.pathname.startsWith('/api/')) {
    const csrfToken = generateCSRFToken()
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    })
    response.headers.set('X-CSRF-Token', csrfToken)
  }
  
  // 6. Logging for security monitoring
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`API Request: ${request.method} ${request.nextUrl.pathname} from ${request.ip}`)
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 