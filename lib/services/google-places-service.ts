// @ts-nocheck

import { Client } from '@googlemaps/google-maps-services-js';

interface PlaceAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface StandardizedAddress {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  administrative_area_level_2?: string;
  country?: string;
  postal_code?: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: AddressComponent[];
}

interface AddressValidationResult {
  isValid: boolean;
  confidence: number;
  standardizedAddress?: StandardizedAddress;
  originalInput: string;
  suggestions?: PlaceAutocompleteResult[];
  error?: string;
}

export class GooglePlacesService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    this.client = new Client({});
    
    if (!this.apiKey) {
      console.warn('Google Places API key not configured - address validation will use fallback mode');
    }
  }

  async autocompleteAddress(
    input: string,
    countryRestriction: string[] = ['us', 'ca']
  ): Promise<PlaceAutocompleteResult[]> {
    try {
      if (!this.apiKey) {
        console.warn('Google Places API key not configured - using fallback mode');
        return [];
      }

      const response = await this.client.placeAutocomplete({
        params: {
          input,
          key: this.apiKey,
          components: countryRestriction.map(country => `country:${country}`) as any,
          types: 'address' as any,
          language: 'en'
        }
      });

      return response.data.predictions || [];
    } catch (error) {
      console.error('Google Places autocomplete error:', error);
      return [];
    }
  }

  async validateAndStandardizeAddress(
    address: string,
    countryRestriction: string[] = ['us', 'ca']
  ): Promise<AddressValidationResult> {
    try {
      if (!this.apiKey) {
        // Use fallback validation when API key is not available
        return this.fallbackAddressValidation(address, countryRestriction);
      }

      // First try geocoding the address directly
      const geocodeResponse = await this.client.geocode({
        params: {
          address,
          key: this.apiKey,
          components: countryRestriction.map(country => `country:${country}`) as any,
          language: 'en'
        }
      });

      if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
        const result = geocodeResponse.data.results[0];
        
        // Parse address components
        const standardizedAddress = this.parseAddressComponents(result);
        
        // Calculate confidence based on geocoding quality
        const confidence = this.calculateGeocodeConfidence(result, address);

        return {
          isValid: true,
          confidence,
          standardizedAddress,
          originalInput: address
        };
      }

      // If direct geocoding failed, try autocomplete for suggestions
      const suggestions = await this.autocompleteAddress(address, countryRestriction);
      
      return {
        isValid: false,
        confidence: 0,
        originalInput: address,
        suggestions: suggestions.slice(0, 5), // Limit to top 5 suggestions
        error: 'Address could not be validated, suggestions provided'
      };

    } catch (error) {
      console.error('Address validation error:', error);
      // Fall back to basic validation if API fails
      return this.fallbackAddressValidation(address, countryRestriction);
    }
  }

  async getPlaceDetails(placeId: string): Promise<StandardizedAddress | null> {
    try {
      if (!this.apiKey) {
        console.warn('Google Places API key not configured - cannot retrieve place details');
        return null;
      }

      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: [
            'formatted_address',
            'address_components',
            'geometry',
            'place_id'
          ]
        }
      });

      if (response.data.result) {
        return this.parseAddressComponents(response.data.result);
      }

      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }

  private parseAddressComponents(result: any): StandardizedAddress {
    const addressComponents: AddressComponent[] = result.address_components || [];
    const parsed: StandardizedAddress = {
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      geometry: result.geometry,
      address_components: addressComponents
    };

    // Extract specific address components
    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('street_number')) {
        parsed.street_number = component.long_name;
      } else if (types.includes('route')) {
        parsed.route = component.long_name;
      } else if (types.includes('locality')) {
        parsed.locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        parsed.administrative_area_level_1 = component.short_name; // State abbreviation
      } else if (types.includes('administrative_area_level_2')) {
        parsed.administrative_area_level_2 = component.long_name; // County
      } else if (types.includes('country')) {
        parsed.country = component.short_name;
      } else if (types.includes('postal_code')) {
        parsed.postal_code = component.long_name;
      }
    }

    return parsed;
  }

  private calculateGeocodeConfidence(result: any, originalInput: string): number {
    let confidence = 0.5; // Base confidence

    // Check location type quality
    const locationTypes = result.types || [];
    if (locationTypes.includes('street_address')) {
      confidence += 0.4;
    } else if (locationTypes.includes('premise')) {
      confidence += 0.3;
    } else if (locationTypes.includes('subpremise')) {
      confidence += 0.25;
    } else if (locationTypes.includes('route')) {
      confidence += 0.2;
    }

    // Check geometry quality
    if (result.geometry?.location_type === 'ROOFTOP') {
      confidence += 0.1;
    } else if (result.geometry?.location_type === 'RANGE_INTERPOLATED') {
      confidence += 0.05;
    }

    // Check partial match
    if (!result.partial_match) {
      confidence += 0.1;
    }

    // Simple string similarity check
    const similarity = this.calculateStringSimilarity(
      originalInput.toLowerCase(),
      result.formatted_address.toLowerCase()
    );
    confidence += similarity * 0.1;

    return Math.min(confidence, 1.0);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1.0 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Fallback address validation when Google Places API is not available
  private fallbackAddressValidation(
    address: string,
    countryRestriction: string[] = ['us', 'ca']
  ): AddressValidationResult {
    const trimmedAddress = address.trim();
    
    if (!trimmedAddress || trimmedAddress.length < 10) {
      return {
        isValid: false,
        confidence: 0,
        originalInput: address,
        error: 'Address too short - please provide a complete address'
      };
    }

    // Basic regex patterns for US/CA addresses
    const addressPatterns = {
      // US: 123 Main St, City, State 12345
      us: /^.+,\s*.+,\s*[A-Za-z]{2}\s*\d{5}(-\d{4})?$/,
      // CA: 123 Main St, City, Province A1A 1A1
      ca: /^.+,\s*.+,\s*[A-Za-z]{2}\s*[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d$/,
      // General pattern: Has commas and some structure
      general: /^.+,\s*.+,\s*.+$/
    };

    const hasNumbers = /\d/.test(trimmedAddress);
    const hasCommas = (trimmedAddress.match(/,/g) || []).length >= 2;
    const hasStateOrProvince = /\b[A-Z]{2}\b/.test(trimmedAddress);
    const hasPostalCode = /\b\d{5}(-\d{4})?\b|\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/.test(trimmedAddress);

    let confidence = 0.3; // Base confidence for fallback mode
    let isValid = false;

    // Check if it matches basic address patterns
    if (addressPatterns.general.test(trimmedAddress)) {
      confidence += 0.2;
      isValid = true;
    }

    // Boost confidence for various address components
    if (hasNumbers) confidence += 0.1;
    if (hasCommas) confidence += 0.1;
    if (hasStateOrProvince) confidence += 0.1;
    if (hasPostalCode) confidence += 0.2;

    // Check for specific country patterns
    if (countryRestriction.includes('us') && addressPatterns.us.test(trimmedAddress)) {
      confidence += 0.2;
      isValid = true;
    }
    if (countryRestriction.includes('ca') && addressPatterns.ca.test(trimmedAddress)) {
      confidence += 0.2;
      isValid = true;
    }

    // Create a basic standardized address (best effort)
    let standardizedAddress: StandardizedAddress | undefined;
    if (isValid) {
      const parts = trimmedAddress.split(',').map(part => part.trim());
      standardizedAddress = {
        formatted_address: trimmedAddress,
        place_id: `fallback_${Date.now()}`,
        geometry: {
          location: { lat: 0, lng: 0 }
        },
        address_components: []
      };

      // Try to parse basic components
      if (parts.length >= 3) {
        standardizedAddress.route = parts[0];
        standardizedAddress.locality = parts[1];
        
        // Try to extract state/province and postal code from the last part
        const lastPart = parts[parts.length - 1];
        const statePostalMatch = lastPart.match(/([A-Z]{2})\s*(.+)/);
        if (statePostalMatch) {
          standardizedAddress.administrative_area_level_1 = statePostalMatch[1];
          standardizedAddress.postal_code = statePostalMatch[2];
        }
      }
    }

    return {
      isValid,
      confidence: Math.min(confidence, 1.0),
      standardizedAddress,
      originalInput: address,
      error: isValid ? undefined : 'Address format not recognized - please check your address format'
    };
  }

  // Compare two addresses and calculate match score
  async compareAddresses(
    userAddress: string,
    extractedAddress: string,
    threshold: number = 0.8
  ): Promise<{
    matchScore: number;
    isMatch: boolean;
    userStandardized?: StandardizedAddress;
    extractedStandardized?: StandardizedAddress;
    differences: string[];
    confidence: number;
  }> {
    try {
      // Validate and standardize both addresses
      const [userResult, extractedResult] = await Promise.all([
        this.validateAndStandardizeAddress(userAddress),
        this.validateAndStandardizeAddress(extractedAddress)
      ]);

      if (!userResult.isValid || !extractedResult.isValid) {
        return {
          matchScore: 0,
          isMatch: false,
          differences: ['One or both addresses could not be validated'],
          confidence: 0
        };
      }

      const userStd = userResult.standardizedAddress!;
      const extractedStd = extractedResult.standardizedAddress!;

      // Calculate component-wise similarity
      const differences: string[] = [];
      let totalScore = 0;
      let componentCount = 0;

      // Compare street address
      if (userStd.street_number && extractedStd.street_number) {
        const streetNumberMatch = userStd.street_number === extractedStd.street_number ? 1 : 0;
        totalScore += streetNumberMatch * 0.2;
        componentCount++;
        if (streetNumberMatch === 0) {
          differences.push(`Street numbers differ: ${userStd.street_number} vs ${extractedStd.street_number}`);
        }
      }

      if (userStd.route && extractedStd.route) {
        const routeMatch = this.calculateStringSimilarity(userStd.route, extractedStd.route);
        totalScore += routeMatch * 0.3;
        componentCount++;
        if (routeMatch < 0.8) {
          differences.push(`Street names differ: ${userStd.route} vs ${extractedStd.route}`);
        }
      }

      // Compare city
      if (userStd.locality && extractedStd.locality) {
        const cityMatch = this.calculateStringSimilarity(userStd.locality, extractedStd.locality);
        totalScore += cityMatch * 0.2;
        componentCount++;
        if (cityMatch < 0.8) {
          differences.push(`Cities differ: ${userStd.locality} vs ${extractedStd.locality}`);
        }
      }

      // Compare state
      if (userStd.administrative_area_level_1 && extractedStd.administrative_area_level_1) {
        const stateMatch = userStd.administrative_area_level_1 === extractedStd.administrative_area_level_1 ? 1 : 0;
        totalScore += stateMatch * 0.2;
        componentCount++;
        if (stateMatch === 0) {
          differences.push(`States differ: ${userStd.administrative_area_level_1} vs ${extractedStd.administrative_area_level_1}`);
        }
      }

      // Compare postal code
      if (userStd.postal_code && extractedStd.postal_code) {
        const postalMatch = userStd.postal_code === extractedStd.postal_code ? 1 : 0;
        totalScore += postalMatch * 0.1;
        componentCount++;
        if (postalMatch === 0) {
          differences.push(`Postal codes differ: ${userStd.postal_code} vs ${extractedStd.postal_code}`);
        }
      }

      const matchScore = componentCount > 0 ? totalScore / componentCount : 0;
      const overallConfidence = Math.min(userResult.confidence, extractedResult.confidence);

      return {
        matchScore,
        isMatch: matchScore >= threshold,
        userStandardized: userStd,
        extractedStandardized: extractedStd,
        differences,
        confidence: overallConfidence
      };

    } catch (error) {
      console.error('Address comparison error:', error);
      return {
        matchScore: 0,
        isMatch: false,
        differences: ['Error during address comparison'],
        confidence: 0
      };
    }
  }
}

export const googlePlacesService = new GooglePlacesService();
