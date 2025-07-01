
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Check, 
  X, 
  Tag, 
  Percent, 
  DollarSign,
  Gift,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface AppliedDiscount {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
}

interface DiscountCodeInputProps {
  planType?: string;
  purchaseAmount?: number;
  onDiscountApplied?: (discount: AppliedDiscount) => void;
  onDiscountRemoved?: () => void;
  appliedDiscount?: AppliedDiscount | null;
  disabled?: boolean;
}

export default function DiscountCodeInput({
  planType,
  purchaseAmount,
  onDiscountApplied,
  onDiscountRemoved,
  appliedDiscount,
  disabled = false
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const validateAndApplyCode = async () => {
    if (!code.trim()) {
      setError('Please enter a discount code');
      return;
    }

    setValidating(true);
    setError('');

    try {
      // Validate the code
      const validateResponse = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          planType,
          purchaseAmount
        })
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        setError(validateData.error || 'Invalid discount code');
        return;
      }

      if (!validateData.isValid) {
        setError(validateData.error || 'Discount code is not valid');
        return;
      }

      // Apply the discount
      const applyResponse = await fetch('/api/discount-codes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discountCodeId: validateData.discountCode.id,
          originalAmount: purchaseAmount,
          planType
        })
      });

      const applyData = await applyResponse.json();

      if (!applyResponse.ok) {
        setError(applyData.error || 'Failed to apply discount code');
        return;
      }

      // Success - notify parent component
      if (onDiscountApplied) {
        onDiscountApplied({
          id: validateData.discountCode.id,
          code: validateData.discountCode.code,
          name: validateData.discountCode.name,
          description: validateData.discountCode.description,
          discountType: validateData.discountCode.discountType,
          discountValue: validateData.discountCode.discountValue,
          discountAmount: validateData.discountCode.discountAmount || 0
        });
      }

      setCode('');
      toast.success('Discount code applied successfully!');

    } catch (error) {
      setError('Failed to validate discount code');
    } finally {
      setValidating(false);
    }
  };

  const removeDiscount = () => {
    if (onDiscountRemoved) {
      onDiscountRemoved();
    }
    toast.success('Discount code removed');
  };

  const getDiscountIcon = (discountType: string) => {
    switch (discountType) {
      case 'PERCENTAGE':
        return <Percent className="h-4 w-4" />;
      case 'FIXED_AMOUNT':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getDiscountDisplay = (discount: AppliedDiscount) => {
    if (discount.discountType === 'PERCENTAGE') {
      return `${discount.discountValue}% off`;
    }
    if (discount.discountType === 'FIXED_AMOUNT') {
      return `$${discount.discountValue} off`;
    }
    return discount.discountType.replace('_', ' ');
  };

  if (appliedDiscount) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Discount Applied</h3>
                  <p className="text-sm text-muted-foreground">{appliedDiscount.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeDiscount}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                {getDiscountIcon(appliedDiscount.discountType)}
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {appliedDiscount.code}
                    </Badge>
                    <span className="text-sm font-medium text-green-700">
                      {getDiscountDisplay(appliedDiscount)}
                    </span>
                  </div>
                  {appliedDiscount.description && (
                    <p className="text-xs text-green-600 mt-1">
                      {appliedDiscount.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-700">
                  -${appliedDiscount.discountAmount.toFixed(2)}
                </div>
                <div className="text-xs text-green-600">Savings</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <Label htmlFor="discountCode" className="text-base font-medium">
              Have a discount code?
            </Label>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="discountCode"
                placeholder="Enter discount code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    validateAndApplyCode();
                  }
                }}
                disabled={disabled || validating}
                className={error ? 'border-red-500' : ''}
              />
            </div>
            <Button
              onClick={validateAndApplyCode}
              disabled={disabled || validating || !code.trim()}
              variant="outline"
            >
              {validating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground">
            Enter your discount code to receive special pricing or promotional offers.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

