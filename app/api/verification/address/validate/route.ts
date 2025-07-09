
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geoapifyService } from '@/lib/services/geoapify-service';

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

    if (placeId && placeId.startsWith('geoapify_')) {
      // For Geoapify place IDs, we'll validate the address directly
      validationResult = await geoapifyService.validateAndStandardizeAddress(
        address || '',
        countryRestriction || ['us', 'ca']
      );
    } else if (placeId) {
      // Try to get place details by place ID (may not be available in Geoapify)
      const placeDetails = await geoapifyService.getPlaceDetails(placeId);
      if (placeDetails) {
        validationResult = {
          isValid: true,
          confidence: 0.95,
          standardizedAddress: placeDetails,
          originalInput: address || placeDetails.formatted_address
        };
      } else {
        // Fall back to address validation
        validationResult = await geoapifyService.validateAndStandardizeAddress(
          address || '',
          countryRestriction || ['us', 'ca']
        );
      }
    } else {
      // Validate address string
      validationResult = await geoapifyService.validateAndStandardizeAddress(
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
