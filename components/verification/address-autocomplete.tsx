
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

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onValidationChange: (validation: AddressValidationResult | null) => void;
  placeholder?: string;
  required?: boolean;
  countryRestriction?: string[];
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onValidationChange,
  placeholder = "Enter your address",
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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions when user types
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length >= 3 && !selectedSuggestion) {
      debounceRef.current = setTimeout(async () => {
        await fetchSuggestions(value);
      }, 300);
    } else if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, selectedSuggestion]);

  // Validate address when user stops typing or selects suggestion
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length >= 5) { // Reduced from 10 to 5 for better UX
      debounceRef.current = setTimeout(async () => {
        await validateAddress(value, selectedSuggestion?.place_id);
      }, 800); // Reduced from 1000ms to 800ms for faster response
    } else if (value.length === 0) {
      setValidationResult(null);
      onValidationChange(null);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (input: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/verification/address/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          countryRestriction
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAddress = async (address: string, placeId?: string) => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/verification/address/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          placeId,
          countryRestriction
        })
      });

      if (response.ok) {
        const data = await response.json();
        const validation = data.validation as AddressValidationResult;
        setValidationResult(validation);
        onValidationChange(validation);
      }
    } catch (error) {
      console.error('Error validating address:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedSuggestion(null);
    setValidationResult(null);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.description);
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (validationResult) {
      if (validationResult.isValid && validationResult.confidence > 0.7) {
        return <Check className="h-4 w-4 text-green-500" />;
      } else {
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      }
    }
    
    return null;
  };

  const getValidationMessage = () => {
    if (!validationResult) return null;
    
    if (validationResult.isValid) {
      if (validationResult.confidence > 0.9) {
        return "Address verified with high confidence";
      } else if (validationResult.confidence > 0.7) {
        return "Address verified";
      } else if (validationResult.confidence > 0.3) {
        return "Address accepted - format looks good";
      } else {
        return "Address format accepted";
      }
    } else {
      // More forgiving error messages
      if (validationResult.suggestions && validationResult.suggestions.length > 0) {
        return "Address format accepted - suggestions available below";
      } else {
        return "Address format accepted - please ensure it's correct";
      }
    }
  };

  const getValidationColor = () => {
    if (!validationResult) return "";
    
    if (validationResult.isValid) {
      if (validationResult.confidence > 0.8) return "text-green-600";
      if (validationResult.confidence > 0.3) return "text-blue-600";
      return "text-yellow-600";
    }
    // More forgiving - even "invalid" addresses show as yellow (acceptable)
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

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white border shadow-lg"
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.main_text}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.secondary_text}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
          
          {!validationResult.isValid && validationResult.suggestions && validationResult.suggestions.length > 0 && (
            <div className="mt-2 p-3 bg-orange-50 rounded-md">
              <div className="text-sm font-medium text-orange-800 mb-2">
                Did you mean:
              </div>
              <div className="space-y-1">
                {validationResult.suggestions.slice(0, 3).map((suggestion) => (
                  <Button
                    key={suggestion.place_id}
                    variant="ghost"
                    size="sm"
                    className="text-left justify-start h-auto p-2 text-orange-700 hover:bg-orange-100 w-full"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="truncate">
                      <div className="font-medium">{suggestion.main_text}</div>
                      <div className="text-xs text-orange-600">{suggestion.secondary_text}</div>
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
