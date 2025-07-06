import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const STAKEHOLDER_SESSION_COOKIE = 'stakeholder_auth';
export const STAGING_PASSWORD = 'SafePlay2025Beta!'; // Temporarily hardcoded for testing
export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface StakeholderSession {
  authenticated: boolean;
  timestamp: number;
  rememberMe: boolean;
  userAgent: string;
}

export function isValidStakeholderSession(request: NextRequest): boolean {
  try {
    const sessionCookie = request.cookies.get(STAKEHOLDER_SESSION_COOKIE);
    if (!sessionCookie) return false;

    const session: StakeholderSession = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    const now = Date.now();
    const sessionAge = now - session.timestamp;
    const maxAge = session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : SESSION_DURATION; // 30 days if remember me, otherwise 24 hours
    
    if (sessionAge > maxAge) return false;
    
    // Basic user agent validation to prevent session hijacking
    const currentUserAgent = request.headers.get('user-agent') || '';
    if (session.userAgent !== currentUserAgent) return false;
    
    return session.authenticated;
  } catch (error) {
    console.error('Error validating stakeholder session:', error);
    return false;
  }
}

export function createStakeholderSession(request: NextRequest, rememberMe: boolean = false): string {
  const session: StakeholderSession = {
    authenticated: true,
    timestamp: Date.now(),
    rememberMe,
    userAgent: request.headers.get('user-agent') || ''
  };
  
  return JSON.stringify(session);
}

export function clearStakeholderSession(): NextResponse {
  const response = NextResponse.redirect(new URL('/staging-auth', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  response.cookies.delete(STAKEHOLDER_SESSION_COOKIE);
  return response;
}

// Bot detection patterns
export const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegram',
  'discord',
  'crawler',
  'spider',
  'bot',
  'scraper'
];

export function isBotRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  return BOT_USER_AGENTS.some(bot => userAgent.includes(bot));
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;
  
  const current = rateLimitStore.get(ip);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (current.count >= maxAttempts) {
    return true;
  }
  
  current.count++;
  return false;
}
