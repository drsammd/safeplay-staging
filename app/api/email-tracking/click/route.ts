
import { NextRequest, NextResponse } from 'next/server';
import { emailAutomationService } from '@/lib/services/email-automation-service';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const emailLogId = searchParams.get('id');
    const targetUrl = searchParams.get('url');

    if (!emailLogId || !targetUrl) {
      return NextResponse.redirect(targetUrl || 'https://safeplay.app', 302);
    }

    // Extract metadata from request
    const metadata = {
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      referrer: request.headers.get('referer') || 'unknown'
    };

    // Track the email click
    await emailAutomationService.trackEmailClick(emailLogId, targetUrl, metadata);

    // Redirect to the target URL
    return NextResponse.redirect(targetUrl, 302);

  } catch (error) {
    console.error('Error tracking email click:', error);
    
    // Still redirect even if tracking fails
    const targetUrl = request.nextUrl.searchParams.get('url');
    return NextResponse.redirect(targetUrl || 'https://safeplay.app', 302);
  }
}
