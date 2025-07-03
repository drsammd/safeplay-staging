
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

    const { address, placeId, countryRestriction } = await request.json();

    if (!address && !placeId) {
      return NextResponse.json({ 
        error: 'Either address or placeId is required' 
      }, { status: 400 });
    }

    let validationResult;

    if (placeId) {
      // Get place details by place ID
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
      if (placeDetails) {
        validationResult = {
          isValid: true,
          confidence: 0.95, // High confidence for place ID lookups
          standardizedAddress: placeDetails,
          originalInput: address || placeDetails.formatted_address
        };
      } else {
        validationResult = {
          isValid: false,
          confidence: 0,
          originalInput: address || '',
          error: 'Place not found'
        };
      }
    } else {
      // Validate address string
      validationResult = await googlePlacesService.validateAndStandardizeAddress(
        address,
        countryRestriction || ['us', 'ca']
      );
    }

    return NextResponse.json({
      success: true,
      validation: {
        isValid: validationResult.isValid,
        confidence: validationResult.confidence,
        standardizedAddress: validationResult.standardizedAddress,
        originalInput: validationResult.originalInput,
        suggestions: validationResult.suggestions,
        error: validationResult.error
      }
    });

  } catch (error) {
    console.error('Address validation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
