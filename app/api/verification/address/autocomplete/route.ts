
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { googlePlacesService } from '@/lib/services/google-places-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { input, countryRestriction } = await request.json();

    if (!input || input.trim().length < 3) {
      return NextResponse.json({ 
        error: 'Input must be at least 3 characters' 
      }, { status: 400 });
    }

    const suggestions = await googlePlacesService.autocompleteAddress(
      input.trim(),
      countryRestriction || ['us', 'ca']
    );

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map(suggestion => ({
        place_id: suggestion.place_id,
        description: suggestion.description,
        main_text: suggestion.structured_formatting.main_text,
        secondary_text: suggestion.structured_formatting.secondary_text,
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
