
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, Check, AlertCircle, Loader2 } from 'lucide-react';

interface AddressSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
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
}

interface AddressValidationResult {
  isValid: boolean;
  confidence: number;
  standardizedAddress?: StandardizedAddress;
  originalInput: string;
  suggestions?: AddressSuggestion[];
  error?: string;
}

interface AddressFields {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onValidationChange: (validation: AddressValidationResult | null) => void;
  onFieldsChange?: (fields: AddressFields) => void;
  placeholder?: string;
  required?: boolean;
  countryRestriction?: string[];
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onValidationChange,
  onFieldsChange,
  placeholder = "Start typing your address (e.g., 123 Main St)",
  required = false,
  countryRestriction = ['us', 'ca'],
  className = ""
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const validationDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // FIXED: Autocomplete suggestions logic with separate timeout reference
  useEffect(() => {
    console.log(`🔍 AUTOCOMPLETE DEBUG: useEffect triggered with value: "${value}"`);
    
    if (suggestionsDebounceRef.current) {
      clearTimeout(suggestionsDebounceRef.current);
      console.log(`🔍 AUTOCOMPLETE DEBUG: Cleared previous suggestions timeout`);
    }

    // FIXED: Enhanced input validation before calling autocomplete
    const trimmedValue = value.trim();
    const hasLetters = /[a-zA-Z]/.test(trimmedValue);
    const hasNumbers = /[0-9]/.test(trimmedValue);
    
    console.log(`🔍 AUTOCOMPLETE DEBUG: Analysis - trimmed: "${trimmedValue}", length: ${trimmedValue.length}, hasLetters: ${hasLetters}, hasNumbers: ${hasNumbers}, selectedSuggestion: ${!!selectedSuggestion}`);
    
    // FIXED: More permissive condition - allow addresses starting with numbers (house numbers)
    // Most US addresses start with numbers like "123 Main St", so we should allow autocomplete for those
    const shouldFetchSuggestions = trimmedValue.length >= 2 && (hasLetters || (hasNumbers && trimmedValue.length >= 3));

    console.log(`🔍 AUTOCOMPLETE DEBUG: shouldFetchSuggestions: ${shouldFetchSuggestions}`);

    if (shouldFetchSuggestions) {
      console.log(`📞 AUTOCOMPLETE DEBUG: Setting suggestions timeout to fetch for "${trimmedValue}"`);
      suggestionsDebounceRef.current = setTimeout(async () => {
        try {
          console.log(`📞 AUTOCOMPLETE DEBUG: Suggestions timeout fired - Making API call for "${trimmedValue}"`);
          await fetchSuggestions(trimmedValue);
          console.log(`✅ AUTOCOMPLETE DEBUG: Suggestions API call completed for "${trimmedValue}"`);
        } catch (error) {
          console.error(`❌ AUTOCOMPLETE DEBUG: Suggestions API call failed for "${trimmedValue}":`, error);
        }
      }, 300);
    } else {
      console.log(`🚫 AUTOCOMPLETE DEBUG: Not fetching suggestions - condition not met`);
      if (trimmedValue.length < 2) {
        console.log(`🚫 AUTOCOMPLETE DEBUG: Input too short (${trimmedValue.length} < 2), clearing suggestions`);
        setSuggestions([]);
        setShowSuggestions(false);
      } else if (!hasLetters && (!hasNumbers || trimmedValue.length < 3)) {
        console.log(`🚫 AUTOCOMPLETE DEBUG: Input doesn't meet criteria (needs letters OR 3+ numbers), clearing suggestions`);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }

    return () => {
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current);
        console.log(`🔍 AUTOCOMPLETE DEBUG: Cleanup - cleared suggestions timeout`);
      }
    };
  }, [value]);

  // FIXED: Address validation logic with separate timeout reference
  useEffect(() => {
    if (validationDebounceRef.current) {
      clearTimeout(validationDebounceRef.current);
      console.log(`🔍 VALIDATION DEBUG: Cleared previous validation timeout`);
    }

    // 🔧 UX IMPROVEMENT: Even lower minimum character requirement for validation to match suggestions
    if (value.length >= 3) {
      console.log(`📞 VALIDATION DEBUG: Setting validation timeout for "${value}"`);
      validationDebounceRef.current = setTimeout(async () => {
        console.log(`📞 VALIDATION DEBUG: Validation timeout fired for "${value}"`);
        await validateAddress(value, selectedSuggestion?.place_id);
        console.log(`✅ VALIDATION DEBUG: Validation completed for "${value}"`);
      }, 400); // 🔧 UX IMPROVEMENT: Faster validation for better responsiveness
    } else if (value.length === 0) {
      console.log(`🔍 VALIDATION DEBUG: Empty value, clearing validation result`);
      setValidationResult(null);
      onValidationChange(null);
    }

    return () => {
      if (validationDebounceRef.current) {
        clearTimeout(validationDebounceRef.current);
        console.log(`🔍 VALIDATION DEBUG: Cleanup - cleared validation timeout`);
      }
    };
  }, [value, selectedSuggestion]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    // Use a slight delay to allow the component to mount properly
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (input: string) => {
    console.log(`🔍 FETCHSUGGESTIONS: Starting fetch for "${input}"`);
    setIsLoading(true);
    
    try {
      console.log(`📡 FETCHSUGGESTIONS: Making API request to /api/verification/address/autocomplete`);
      console.log(`📡 FETCHSUGGESTIONS: Request body:`, { input, countryRestriction });
      
      const response = await fetch('/api/verification/address/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          countryRestriction: countryRestriction || ['us', 'ca']
        })
      });

      console.log(`📡 FETCHSUGGESTIONS: API response status:`, response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log(`📡 FETCHSUGGESTIONS: Raw API response:`, JSON.stringify(data, null, 2));
        
        const fetchedSuggestions = data.suggestions || [];
        
        console.log(`✅ FETCHSUGGESTIONS: Processed ${fetchedSuggestions.length} suggestions for "${input}"`);
        console.log(`📍 FETCHSUGGESTIONS: Expected 4-5 suggestions, got:`, fetchedSuggestions.length);
        console.log(`📍 FETCHSUGGESTIONS: Suggestion details:`, fetchedSuggestions.map((s, idx) => ({
          index: idx + 1,
          place_id: s.place_id,
          main_text: s.main_text,
          secondary_text: s.secondary_text,
          description: s.description
        })));
        
        setSuggestions(fetchedSuggestions);
        setShowSuggestions(fetchedSuggestions.length > 0);
        
        console.log(`✅ FETCHSUGGESTIONS: State updated - showing ${fetchedSuggestions.length} suggestions in dropdown`);
        console.log(`✅ FETCHSUGGESTIONS: showSuggestions state set to:`, fetchedSuggestions.length > 0);
      } else {
        const errorText = await response.text();
        console.error(`❌ FETCHSUGGESTIONS: API error ${response.status}:`, errorText);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error(`❌ FETCHSUGGESTIONS: Exception occurred:`, error);
      console.error(`❌ FETCHSUGGESTIONS: Error details:`, {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      console.log(`🔍 FETCHSUGGESTIONS: Completed fetch for "${input}" - setting loading to false`);
      setIsLoading(false);
    }
  };

  const validateAddress = async (address: string, placeId?: string) => {
    setIsValidating(true);
    try {
      console.log(`🔍 BILLING ADDRESS DEBUG: === STARTING ADDRESS VALIDATION ===`);
      console.log(`🔍 BILLING ADDRESS DEBUG: address:`, address);
      console.log(`🔍 BILLING ADDRESS DEBUG: placeId:`, placeId);
      console.log(`🔍 BILLING ADDRESS DEBUG: countryRestriction:`, countryRestriction);
      
      const requestBody = {
        address,
        placeId,
        countryRestriction
      };
      console.log(`🔍 BILLING ADDRESS DEBUG: API request body:`, JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/verification/address/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log(`🔍 BILLING ADDRESS DEBUG: API response status:`, response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log(`🔍 BILLING ADDRESS DEBUG: Raw API response data:`, JSON.stringify(data, null, 2));
        
        const validation = data.validation as AddressValidationResult;
        
        console.log(`🔍 BILLING ADDRESS DEBUG: Extracted validation object:`, JSON.stringify(validation, null, 2));
        console.log(`✅ BILLING ADDRESS DEBUG: Address validation result summary:`, {
          isValid: validation.isValid,
          confidence: validation.confidence,
          hasStandardizedAddress: !!validation.standardizedAddress,
          hasSuggestions: validation.suggestions?.length || 0
        });
        
        setValidationResult(validation);
        onValidationChange(validation);

        // Extract address fields if validation was successful
        if (validation.isValid && validation.standardizedAddress) {
          console.log(`🔧 BILLING ADDRESS DEBUG: === CALLING parseAddressFields ===`);
          console.log(`🔧 BILLING ADDRESS DEBUG: standardizedAddress being passed:`, JSON.stringify(validation.standardizedAddress, null, 2));
          
          const fields = parseAddressFields(validation.standardizedAddress);
          
          console.log(`🔧 BILLING ADDRESS DEBUG: === CALLING onFieldsChange CALLBACK ===`);
          console.log(`🔧 BILLING ADDRESS DEBUG: fields being passed to onFieldsChange:`, JSON.stringify(fields, null, 2));
          
          onFieldsChange?.(fields);
          
          console.log(`🔧 BILLING ADDRESS DEBUG: ✅ onFieldsChange callback completed`);
        } else {
          console.log(`⚠️ BILLING ADDRESS DEBUG: No valid standardized address to parse`);
          console.log(`⚠️ BILLING ADDRESS DEBUG: validation.isValid:`, validation.isValid);
          console.log(`⚠️ BILLING ADDRESS DEBUG: validation.standardizedAddress:`, validation.standardizedAddress);
        }
      } else {
        console.error('🚨 BILLING ADDRESS DEBUG: Address validation API error:', response.status);
        const errorText = await response.text();
        console.error('🚨 BILLING ADDRESS DEBUG: Error response text:', errorText);
      }
    } catch (error) {
      console.error('🚨 BILLING ADDRESS DEBUG: Exception during address validation:', error);
      console.error('🚨 BILLING ADDRESS DEBUG: Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
    } finally {
      setIsValidating(false);
      console.log(`🔍 BILLING ADDRESS DEBUG: === ADDRESS VALIDATION COMPLETED ===`);
    }
  };

  const parseAddressFields = (standardizedAddress: StandardizedAddress): AddressFields => {
    console.log('🔧 BILLING ADDRESS DEBUG: === PARSING ADDRESS FIELDS ===');
    console.log('🔧 BILLING ADDRESS DEBUG: standardizedAddress input:', JSON.stringify(standardizedAddress, null, 2));
    
    // Extract street address with more fallback options
    let street = '';
    if (standardizedAddress.street_number && standardizedAddress.route) {
      street = `${standardizedAddress.street_number} ${standardizedAddress.route}`;
    } else if (standardizedAddress.route) {
      street = standardizedAddress.route;
    } else if (standardizedAddress.formatted_address) {
      // Try to extract street from formatted address as fallback
      const addressParts = standardizedAddress.formatted_address.split(',');
      street = addressParts[0]?.trim() || '';
    }

    const result = {
      street: street || '',
      city: standardizedAddress.locality || '',
      state: standardizedAddress.administrative_area_level_1 || '',
      zipCode: standardizedAddress.postal_code || '',
      fullAddress: standardizedAddress.formatted_address || ''
    };
    
    console.log('🔧 BILLING ADDRESS DEBUG: Parsed fields result:', JSON.stringify(result, null, 2));
    console.log('🔧 BILLING ADDRESS DEBUG: Field breakdown:');
    console.log('🔧 BILLING ADDRESS DEBUG:   - street:', result.street, '(from:', standardizedAddress.street_number, '+', standardizedAddress.route, ')');
    console.log('🔧 BILLING ADDRESS DEBUG:   - city:', result.city, '(from locality:', standardizedAddress.locality, ')');
    console.log('🔧 BILLING ADDRESS DEBUG:   - state:', result.state, '(from admin_area_1:', standardizedAddress.administrative_area_level_1, ')');
    console.log('🔧 BILLING ADDRESS DEBUG:   - zipCode:', result.zipCode, '(from postal_code:', standardizedAddress.postal_code, ')');
    console.log('🔧 BILLING ADDRESS DEBUG:   - fullAddress:', result.fullAddress, '(from formatted_address:', standardizedAddress.formatted_address, ')');
    console.log('🔧 BILLING ADDRESS DEBUG: === END PARSING ADDRESS FIELDS ===');
    
    return result;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log(`🔍 INPUT CHANGE: New value: "${newValue}"`);
    
    // Clear previous state
    setSelectedSuggestion(null);
    setValidationResult(null);
    setSuggestions([]); // Clear any existing suggestions
    setShowSuggestions(false);
    
    // Update parent component
    onChange(newValue);
    
    console.log(`🔍 INPUT CHANGE: State cleared and parent notified`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    console.log('🎯 BILLING ADDRESS DEBUG: === SUGGESTION CLICKED ===');
    console.log('🎯 BILLING ADDRESS DEBUG: suggestion object:', JSON.stringify(suggestion, null, 2));
    console.log('🎯 BILLING ADDRESS DEBUG: suggestion.description:', suggestion.description);
    console.log('🎯 BILLING ADDRESS DEBUG: suggestion.place_id:', suggestion.place_id);
    
    console.log('🔧 BILLING ADDRESS DEBUG: Setting input value and state...');
    onChange(suggestion.description);
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    // Clear any pending validation
    setValidationResult(null);
    
    // 🔧 BILLING ADDRESS FIX: Automatically trigger validation when address is selected
    // This will populate billing address fields via onFieldsChange callback
    console.log('🔧 BILLING ADDRESS DEBUG: About to trigger automatic validation...');
    console.log('🔧 BILLING ADDRESS DEBUG: Address to validate:', suggestion.description);
    console.log('🔧 BILLING ADDRESS DEBUG: Place ID to use:', suggestion.place_id);
    
    // Trigger validation immediately for better UX
    setTimeout(() => {
      console.log('🔧 BILLING ADDRESS DEBUG: === STARTING AUTOMATIC VALIDATION AFTER SUGGESTION CLICK ===');
      validateAddress(suggestion.description, suggestion.place_id).then(() => {
        console.log('🔧 BILLING ADDRESS DEBUG: ✅ Automatic validation completed after suggestion click');
        inputRef.current?.focus();
      }).catch((error) => {
        console.error('🔧 BILLING ADDRESS DEBUG: ❌ Automatic validation failed after suggestion click:', error);
        inputRef.current?.focus();
      });
    }, 150); // Slightly longer delay to ensure all state updates are complete
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (validationResult) {
      // IMPROVED: More lenient validation feedback
      if (validationResult.isValid && validationResult.confidence > 0.4) {
        return <Check className="h-4 w-4 text-green-500" />;
      } else if (validationResult.confidence > 0.2) {
        return <Check className="h-4 w-4 text-yellow-500" />;
      } else {
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      }
    }
    
    return null;
  };

  const getValidationMessage = () => {
    if (!validationResult) return null;
    
    // IMPROVED: More encouraging validation messages
    if (validationResult.isValid) {
      if (validationResult.confidence > 0.8) {
        return "Address verified with high confidence";
      } else if (validationResult.confidence > 0.6) {
        return "Address verified and looks good";
      } else if (validationResult.confidence > 0.4) {
        return "Address format is acceptable";
      } else {
        return "Address format accepted";
      }
    } else {
      // More encouraging messages for "invalid" addresses
      if (validationResult.suggestions && validationResult.suggestions.length > 0) {
        return "Address format accepted - see suggestions below if needed";
      } else {
        return "Address format accepted - please verify it's correct";
      }
    }
  };

  const getValidationColor = () => {
    if (!validationResult) return "";
    
    // IMPROVED: More lenient color coding
    if (validationResult.isValid) {
      if (validationResult.confidence > 0.6) return "text-green-600";
      if (validationResult.confidence > 0.4) return "text-green-600";
      return "text-yellow-600";
    }
    // Even "invalid" addresses show as acceptable
    return "text-yellow-600";
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="pl-10 pr-10"
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        
        {/* Map pin icon */}
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        {/* Validation icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
        
        {/* Loading indicator for suggestions */}
        {isLoading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* 🔧 UX IMPROVEMENT: Enhanced suggestions dropdown with better visibility and prominence */}
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-[9999] w-full mt-2 max-h-96 overflow-y-auto bg-white border-2 border-blue-300 shadow-2xl rounded-lg"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="p-3">
            <div className="text-sm text-blue-700 font-semibold mb-3 px-3 py-2 bg-blue-100 rounded-md border border-blue-200">
              📍 {suggestions.length} address suggestion{suggestions.length !== 1 ? 's' : ''} found - click any to select
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-all duration-200 rounded-md hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-transparent hover:border-l-blue-400"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`🎯 ADDRESS AUTOCOMPLETE: Dropdown item ${index + 1} of ${suggestions.length} clicked:`, suggestion);
                  console.log(`🎯 ADDRESS AUTOCOMPLETE: Suggestion details:`, {
                    place_id: suggestion.place_id,
                    description: suggestion.description,
                    main_text: suggestion.main_text,
                    secondary_text: suggestion.secondary_text
                  });
                  console.log(`🎯 ADDRESS AUTOCOMPLETE: About to call handleSuggestionClick...`);
                  handleSuggestionClick(suggestion);
                  console.log(`🎯 ADDRESS AUTOCOMPLETE: handleSuggestionClick completed`);
                }}
                onMouseDown={(e) => {
                  // Prevent input blur while allowing click to process
                  e.preventDefault();
                }}
                onMouseEnter={() => {
                  console.log(`🎯 ADDRESS AUTOCOMPLETE: Hovering over suggestion ${index + 1}: ${suggestion.main_text}`);
                }}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm leading-relaxed">
                      {suggestion.main_text}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {suggestion.secondary_text}
                    </div>
                  </div>
                  <div className="text-sm text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
                    Select
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Validation result */}
      {validationResult && (
        <div className="mt-2">
          <div className={`flex items-center gap-2 text-sm ${getValidationColor()}`}>
            {getValidationIcon()}
            <span>{getValidationMessage()}</span>
          </div>
          
          {validationResult.isValid && validationResult.standardizedAddress && (
            <div className="mt-2 p-3 bg-green-50 rounded-md">
              <div className="text-sm font-medium text-green-800 mb-1">
                Standardized Address:
              </div>
              <div className="text-sm text-green-700">
                {validationResult.standardizedAddress.formatted_address}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Confidence: {Math.round(validationResult.confidence * 100)}%
                </Badge>
                {validationResult.standardizedAddress.country && (
                  <Badge variant="outline" className="text-xs">
                    {validationResult.standardizedAddress.country}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* IMPROVED: Show validation suggestions more prominently */}
          {validationResult.suggestions && validationResult.suggestions.length > 0 && (
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Similar addresses you might mean:
              </div>
              <div className="space-y-1">
                {validationResult.suggestions.slice(0, 4).map((suggestion) => (
                  <Button
                    key={suggestion.place_id}
                    variant="ghost"
                    size="sm"
                    className="text-left justify-start h-auto p-2 text-blue-700 hover:bg-blue-100 w-full"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="truncate">
                      <div className="font-medium text-sm">{suggestion.main_text}</div>
                      <div className="text-xs text-blue-600">{suggestion.secondary_text}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
