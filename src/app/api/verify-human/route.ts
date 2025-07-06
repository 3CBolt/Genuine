import { NextRequest, NextResponse } from 'next/server'
import { PresenceToken, isTokenExpired } from '../../../lib/genuine-verify/presence'

// In-memory store for one-time use tokens (optional feature)
const usedTokens = new Map<string, number>()
const TOKEN_USE_TTL = 5 * 60 * 1000 // 5 minutes

interface VerifyHumanRequest {
  token?: string
}

interface VerifyHumanResponse {
  valid: boolean
  reason: string | null
  gestureType?: string
  expiresIn?: number
  issuedAt?: string
}

async function extractTokenFromRequest(request: NextRequest): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Try JSON body
  try {
    const body = await request.json()
    if (body && typeof body === 'object' && 'token' in body) {
      return body.token as string
    }
  } catch (error) {
    // Body parsing failed, continue to return null
  }

  return null
}

function validateTokenStructure(token: any): token is PresenceToken {
  return (
    token &&
    typeof token === 'object' &&
    typeof token.token === 'string' &&
    typeof token.gesture === 'string' &&
    ['blink', 'headTilt'].includes(token.gesture) &&
    typeof token.issuedAt === 'string' &&
    typeof token.expiresAt === 'string' &&
    typeof token.version === 'number'
  )
}

function checkOneTimeUse(tokenId: string, enableOneTimeUse: boolean = false): { valid: boolean; reason?: string } {
  if (!enableOneTimeUse) {
    return { valid: true }
  }

  const now = Date.now()
  const usedTime = usedTokens.get(tokenId)
  
  if (usedTime) {
    // Check if the usage record has expired
    if (now - usedTime > TOKEN_USE_TTL) {
      usedTokens.delete(tokenId)
      return { valid: true }
    }
    return { valid: false, reason: 'Token already used' }
  }

  // Mark token as used
  usedTokens.set(tokenId, now)
  
  // Clean up old entries
  for (const [id, time] of Array.from(usedTokens.entries())) {
    if (now - time > TOKEN_USE_TTL) {
      usedTokens.delete(id)
    }
  }

  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    // Extract token from request
    const token = await extractTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Missing token. Provide token via Authorization header (Bearer <token>) or JSON body ({ token: string })'
        },
        { status: 400 }
      )
    }

    // Parse token (assuming it's a JSON string)
    let tokenData: any
    try {
      tokenData = JSON.parse(token)
    } catch (error) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Malformed token format'
        },
        { status: 400 }
      )
    }

    // Validate token structure
    if (!validateTokenStructure(tokenData)) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Invalid token structure'
        },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (isTokenExpired(tokenData)) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Token expired'
        },
        { status: 401 }
      )
    }

    // Check one-time use (optional feature)
    const enableOneTimeUse = request.nextUrl.searchParams.get('oneTimeUse') === 'true'
    const oneTimeUseCheck = checkOneTimeUse(tokenData.token, enableOneTimeUse)
    
    if (!oneTimeUseCheck.valid) {
      return NextResponse.json(
        {
          valid: false,
          reason: oneTimeUseCheck.reason || 'Token validation failed'
        },
        { status: 403 }
      )
    }

    // Calculate time remaining
    const expiresAt = new Date(tokenData.expiresAt)
    const now = new Date()
    const expiresIn = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))

    // Return success response
    const response: VerifyHumanResponse = {
      valid: true,
      reason: null,
      gestureType: tokenData.gesture,
      expiresIn,
      issuedAt: tokenData.issuedAt
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error verifying human token:', error)
    return NextResponse.json(
      {
        valid: false,
        reason: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Also support GET requests for testing
export async function GET(request: NextRequest) {
  return POST(request)
} 