
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geoapifyService } from '@/lib/services/geoapify-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Allow unauthenticated access for signup flow
    const session = await getServerSession(authOptions);
    console.log('🔍 Address autocomplete API call:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      allowUnauthenticated: true
    });

    const { input, countryRestriction } = await request.json();

    if (!input || input.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Input must be at least 2 characters' 
      }, { status: 400 });
    }

    const suggestions = await geoapifyService.autocompleteAddress(
      input.trim(),
      countryRestriction || ['us', 'ca']
    );

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map(suggestion => ({
        place_id: suggestion.place_id,
        description: suggestion.description,
        main_text: suggestion.main_text,
        secondary_text: suggestion.secondary_text,
        types: suggestion.types
      }))
    });

  } catch (error) {
    console.error('Address autocomplete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
