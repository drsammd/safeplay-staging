
export interface GeoapifyAddressSuggestion {
  place_id: string;
  display_name: string;
  name: string;
  formatted: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  country_code: string;
  properties: {
    formatted: string;
    name: string;
    street: string;
    housenumber?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    country_code: string;
  };
}

export interface GeoapifyAutocompleteResponse {
  features: Array<{
    properties: {
      formatted: string;
      name: string;
      street: string;
      housenumber?: string;
      city: string;
      state: string;
      postcode: string;
      country: string;
      country_code: string;
      place_id: string;
    };
  }>;
}

export interface StandardizedAddress {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  administrative_area_level_2?: string;
  country?: string;
  postal_code?: string;
  place_id: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  confidence: number;
  standardizedAddress?: StandardizedAddress;
  originalInput: string;
  suggestions?: Array<{
    place_id: string;
    description: string;
    main_text: string;
    secondary_text: string;
    types: string[];
  }>;
  error?: string;
}

export class GeoapifyService {
  private apiKey: string;
  private baseUrl = 'https://api.geoapify.com/v1';

  constructor() {
    this.apiKey = process.env.GEOAPIFY_API_KEY || 'd1052c38439e4091af3f56fb65ddd35a';
    
    if (!this.apiKey) {
      console.warn('Geoapify API key not configured - address validation will use fallback mode');
    }
  }

  async autocompleteAddress(
    input: string,
    countryRestriction: string[] = ['us', 'ca']
  ): Promise<Array<{
    place_id: string;
    description: string;
    main_text: string;
    secondary_text: string;
    types: string[];
  }>> {
    try {
      if (!this.apiKey) {
        console.warn('Geoapify API key not configured - using fallback mode');
        return [];
      }

      const countries = countryRestriction.join(',');
      // FIXED: Remove invalid 'type=address' parameter and increase limit for more suggestions
      const response = await fetch(
        `${this.baseUrl}/geocode/autocomplete?text=${encodeURIComponent(input)}&filter=countrycode:${countries}&apiKey=${this.apiKey}&limit=10&bias=proximity:-74.0060,40.7128&format=json`
      );

      if (!response.ok) {
        throw new Error(`Geoapify API error: ${response.status}`);
      }

      const data: any = await response.json();
      
      console.log(`🔍 GEOAPIFY AUTOCOMPLETE DEBUG: Raw API response:`, JSON.stringify(data, null, 2));
      
      // FIXED: Geoapify autocomplete returns 'results' not 'features' 
      const results = data.results || [];
      console.log(`🔍 GEOAPIFY AUTOCOMPLETE DEBUG: Found ${results.length} results`);
      
      const suggestions = results.map((result: any, index: number) => {
        // FIXED: Access result properties directly (not result.properties)
        const props = result;
        
        // Create a more reliable place_id
        const placeId = props.place_id || `geoapify_${input}_${index}_${Date.now()}`;
        
        // Better main text extraction with more variety
        let mainText = '';
        if (props.housenumber && props.street) {
          mainText = `${props.housenumber} ${props.street}`;
        } else if (props.address_line1 && props.address_line1.length < 50) {
          mainText = props.address_line1;
        } else if (props.street) {
          mainText = props.street;
        } else {
          // More flexible extraction
          const parts = props.formatted.split(',');
          mainText = parts[0]?.trim() || props.formatted;
        }
        
        // Better secondary text with more information
        const secondaryParts = [];
        if (props.city && props.city !== mainText) {
          secondaryParts.push(props.city);
        }
        if (props.state) {
          secondaryParts.push(props.state);
        }
        if (props.postcode) {
          secondaryParts.push(props.postcode);
        }
        if (props.country && props.country !== 'United States') {
          secondaryParts.push(props.country);
        }
        
        return {
          place_id: placeId,
          description: props.formatted,
          main_text: mainText,
          secondary_text: secondaryParts.join(', '),
          types: ['address']
        };
      }) || [];

      // IMPROVED: Filter out duplicates and ensure variety
      const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);
      
      console.log(`📍 Geoapify returned ${results.length} results, processed to ${uniqueSuggestions.length} unique suggestions for: "${input}"`);
      
      return uniqueSuggestions.slice(0, 8); // Return up to 8 suggestions instead of 5
      
    } catch (error) {
      console.error('Geoapify autocomplete error:', error);
      return [];
    }
  }

  // IMPROVED: Helper method to remove duplicate suggestions
  private removeDuplicateSuggestions(suggestions: Array<{
    place_id: string;
    description: string;
    main_text: string;
    secondary_text: string;
    types: string[];
  }>): Array<{
    place_id: string;
    description: string;
    main_text: string;
    secondary_text: string;
    types: string[];
  }> {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      // Create a key based on both main text and secondary text for better deduplication
      const key = `${suggestion.main_text.toLowerCase()}_${suggestion.secondary_text.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async validateAndStandardizeAddress(
    address: string,
    countryRestriction: string[] = ['us', 'ca']
  ): Promise<AddressValidationResult> {
    try {
      if (!this.apiKey) {
        return this.fallbackAddressValidation(address, countryRestriction);
      }

      const countries = countryRestriction.join(',');
      const response = await fetch(
        `${this.baseUrl}/geocode/search?text=${encodeURIComponent(address)}&filter=countrycode:${countries}&apiKey=${this.apiKey}&limit=1`
      );

      if (!response.ok) {
        throw new Error(`Geoapify API error: ${response.status}`);
      }

      const data: any = await response.json();
      
      console.log(`🔍 GEOAPIFY DEBUG: Search API response:`, JSON.stringify(data, null, 2));
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        console.log(`🔍 GEOAPIFY DEBUG: First feature:`, JSON.stringify(feature, null, 2));
        
        const standardizedAddress = this.parseGeoapifyResult(feature.properties);
        const confidence = this.calculateConfidence(feature.properties, address);

        console.log(`✅ GEOAPIFY DEBUG: Standardized address:`, JSON.stringify(standardizedAddress, null, 2));

        return {
          isValid: true,
          confidence,
          standardizedAddress,
          originalInput: address
        };
      }

      // IMPROVED: If direct search failed, get MORE suggestions with better parameters
      console.log(`🔍 GEOAPIFY VALIDATION DEBUG: Direct search failed, getting suggestions for: "${address}"`);
      const suggestions = await this.autocompleteAddress(address, countryRestriction);
      console.log(`🔍 GEOAPIFY VALIDATION DEBUG: Got ${suggestions.length} suggestions from autocomplete`);
      
      return {
        isValid: false,
        confidence: 0.3, // IMPROVED: Higher base confidence for suggestions
        originalInput: address,
        suggestions: suggestions.slice(0, 5), // Show up to 5 suggestions
        error: 'Address could not be validated, but here are some suggestions'
      };

    } catch (error) {
      console.error('Geoapify validation error:', error);
      return this.fallbackAddressValidation(address, countryRestriction);
    }
  }

  async getPlaceDetails(placeId: string): Promise<StandardizedAddress | null> {
    try {
      if (!this.apiKey) {
        console.warn('Geoapify API key not configured - cannot retrieve place details');
        return null;
      }

      // Since Geoapify doesn't have a separate place details API like Google,
      // we'll use the search API with the place_id if available
      // For now, return null and let the system handle it gracefully
      return null;
    } catch (error) {
      console.error('Geoapify place details error:', error);
      return null;
    }
  }

  private parseGeoapifyResult(properties: any): StandardizedAddress {
    // Parse Geoapify feature properties
    console.log(`🔧 GEOAPIFY DEBUG: Parsing properties:`, JSON.stringify(properties, null, 2));
    
    const standardized = {
      formatted_address: properties.formatted,
      street_number: properties.housenumber,
      route: properties.street,
      locality: properties.city,
      administrative_area_level_1: properties.state,
      administrative_area_level_2: properties.county,
      country: properties.country_code?.toUpperCase(),
      postal_code: properties.postcode,
      place_id: properties.place_id || `geoapify_${Date.now()}_${Math.random()}`
    };
    
    console.log(`🔧 GEOAPIFY DEBUG: Parsed standardized address:`, JSON.stringify(standardized, null, 2));
    return standardized;
  }

  private getSecondaryText(properties: any): string {
    const parts = [];
    if (properties.city) parts.push(properties.city);
    if (properties.state) parts.push(properties.state);
    if (properties.postcode) parts.push(properties.postcode);
    return parts.join(', ');
  }

  private calculateConfidence(properties: any, originalInput: string): number {
    let confidence = 0.4; // IMPROVED: Higher base confidence

    console.log(`📊 GEOAPIFY DEBUG: Calculating confidence for properties:`, {
      housenumber: properties.housenumber,
      street: properties.street,
      city: properties.city,
      state: properties.state,
      postcode: properties.postcode,
      formatted: properties.formatted
    });
    
    // Higher confidence for complete addresses
    if (properties.housenumber) confidence += 0.2;
    if (properties.street) confidence += 0.2;
    if (properties.city) confidence += 0.1;
    if (properties.state) confidence += 0.1;
    if (properties.postcode) confidence += 0.1;

    // String similarity check
    const similarity = this.calculateStringSimilarity(
      originalInput.toLowerCase(),
      properties.formatted.toLowerCase()
    );
    confidence += similarity * 0.2; // IMPROVED: Higher weight for similarity

    const finalConfidence = Math.min(confidence, 1.0);
    console.log(`📊 GEOAPIFY DEBUG: Calculated confidence: ${finalConfidence} (similarity: ${similarity})`);
    
    return finalConfidence;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
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

  private fallbackAddressValidation(
    address: string,
    countryRestriction: string[] = ['us', 'ca']
  ): AddressValidationResult {
    const trimmedAddress = address.trim();
    
    if (!trimmedAddress || trimmedAddress.length < 5) {
      return {
        isValid: false,
        confidence: 0,
        originalInput: address,
        error: 'Address too short - please provide a more complete address'
      };
    }

    // Basic regex patterns for US/CA addresses
    const addressPatterns = {
      us: /^.+,\s*.+,\s*[A-Za-z]{2}\s*\d{5}(-\d{4})?$/,
      ca: /^.+,\s*.+,\s*[A-Za-z]{2}\s*[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d$/,
      general: /^.+,\s*.+,\s*.+$/
    };

    const hasNumbers = /\d/.test(trimmedAddress);
    const hasCommas = (trimmedAddress.match(/,/g) || []).length >= 1;
    const hasStateOrProvince = /\b[A-Z]{2}\b/.test(trimmedAddress);
    const hasPostalCode = /\b\d{5}(-\d{4})?\b|\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/.test(trimmedAddress);

    let confidence = 0.5; // IMPROVED: Higher base confidence for fallback
    let isValid = false;

    // Check basic address structure
    if (trimmedAddress.length >= 10) {
      confidence += 0.2;
      isValid = true;
    }

    // Boost confidence for various address components
    if (hasNumbers) confidence += 0.1;
    if (hasCommas) confidence += 0.1;
    if (hasStateOrProvince) confidence += 0.1;
    if (hasPostalCode) confidence += 0.2;

    // IMPROVED: More lenient validation - accept more address formats
    if (trimmedAddress.length >= 15 && hasNumbers) {
      confidence += 0.1;
      isValid = true;
    }

    // Check for specific country patterns
    if (countryRestriction.includes('us') && addressPatterns.us.test(trimmedAddress)) {
      confidence += 0.2;
      isValid = true;
    }
    if (countryRestriction.includes('ca') && addressPatterns.ca.test(trimmedAddress)) {
      confidence += 0.2;
      isValid = true;
    }

    // Create a basic standardized address
    let standardizedAddress: StandardizedAddress | undefined;
    if (isValid) {
      const parts = trimmedAddress.split(',').map(part => part.trim());
      standardizedAddress = {
        formatted_address: trimmedAddress,
        place_id: `fallback_${Date.now()}`,
      };

      // Try to parse basic components
      if (parts.length >= 2) {
        standardizedAddress.route = parts[0];
        if (parts.length >= 3) {
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
    }

    return {
      isValid,
      confidence: Math.min(confidence, 1.0),
      standardizedAddress,
      originalInput: address,
      error: isValid ? undefined : 'Address format accepted - please verify it is correct'
    };
  }
}

export const geoapifyService = new GeoapifyService();
