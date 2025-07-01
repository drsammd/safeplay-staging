
'use client';

import React from 'react';
import { z, ZodError } from 'zod';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Types for form validation
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: ValidationError[];
  generalError?: string;
  successMessage?: string;
}

export interface ValidatedFormProps {
  children: React.ReactNode;
  onSubmit: (data: any) => Promise<void>;
  validationSchema: z.ZodSchema;
  className?: string;
  submitButtonText?: string;
  resetOnSuccess?: boolean;
}

// Custom hook for form validation
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: T
) {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isValid, setIsValid] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string>('');
  const [successMessage, setSuccessMessage] = React.useState<string>('');

  // Validate single field
  const validateField = React.useCallback((name: string, value: any) => {
    try {
      // Validate the entire form but only check for errors on this field
      schema.parse(values);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.issues.find(issue => issue.path.includes(name));
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [name]: fieldError.message,
          }));
        }
      }
      return false;
    }
  }, [schema, values]);

  // Validate entire form
  const validateForm = React.useCallback(() => {
    try {
      schema.parse(values);
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const field = issue.path.join('.');
          newErrors[field] = issue.message;
        });
        setErrors(newErrors);
      }
      setIsValid(false);
      return false;
    }
  }, [values, schema]);

  // Handle field change
  const handleChange = React.useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setGeneralError('');
    setSuccessMessage('');
    
    // Validate field after a short delay
    setTimeout(() => validateField(name, value), 300);
  }, [validateField]);

  // Handle form submission
  const handleSubmit = React.useCallback(async (onSubmit: (data: T) => Promise<void>) => {
    setIsSubmitting(true);
    setGeneralError('');
    setSuccessMessage('');

    try {
      if (!validateForm()) {
        setGeneralError('Please fix the errors above before submitting.');
        return false;
      }

      await onSubmit(values);
      setSuccessMessage('Form submitted successfully!');
      return true;
    } catch (error) {
      if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm]);

  // Reset form
  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');
    setIsValid(false);
  }, [initialValues]);

  React.useEffect(() => {
    validateForm();
  }, [validateForm]);

  return {
    values,
    errors,
    isSubmitting,
    isValid,
    generalError,
    successMessage,
    handleChange,
    handleSubmit,
    reset,
    validateField,
    validateForm,
  };
}

// Validated Form Component
export function ValidatedForm({
  children,
  onSubmit,
  validationSchema,
  className = '',
  submitButtonText = 'Submit',
  resetOnSuccess = false,
}: ValidatedFormProps) {
  const [formState, setFormState] = React.useState<FormState>({
    isSubmitting: false,
    isValid: false,
    errors: [],
    generalError: undefined,
    successMessage: undefined,
  });

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      generalError: undefined,
      successMessage: undefined,
    }));

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      // Validate form data
      const validatedData = validationSchema.parse(data);
      
      await onSubmit(validatedData);
      
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        successMessage: 'Form submitted successfully!',
        errors: [],
      }));

      if (resetOnSuccess) {
        e.currentTarget.reset();
      }
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const zodError = error as ZodError;
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          errors: zodError.issues.map((issue: z.ZodIssue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        }));
      } else {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          generalError: error instanceof Error ? error.message : 'An unexpected error occurred',
        }));
      }
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className={className} noValidate>
      {formState.generalError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{formState.generalError}</AlertDescription>
        </Alert>
      )}

      {formState.successMessage && (
        <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{formState.successMessage}</AlertDescription>
        </Alert>
      )}

      {formState.errors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {formState.errors.map((error, index) => (
                <li key={index}>
                  <strong>{error.field}:</strong> {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {children}

      <Button
        type="submit"
        disabled={formState.isSubmitting}
        className="w-full mt-4"
      >
        {formState.isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          submitButtonText
        )}
      </Button>
    </form>
  );
}

// Validated Input Component
export interface ValidatedInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ValidatedInput({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  error,
  value,
  onChange,
  disabled = false,
  className = '',
}: ValidatedInputProps) {
  const [localValue, setLocalValue] = React.useState(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  React.useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        className={error ? 'border-red-500 focus:border-red-500' : ''}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Validated Textarea Component
export interface ValidatedTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export function ValidatedTextarea({
  name,
  label,
  placeholder,
  required = false,
  error,
  value,
  onChange,
  disabled = false,
  rows = 4,
  className = '',
}: ValidatedTextareaProps) {
  const [localValue, setLocalValue] = React.useState(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  React.useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        rows={rows}
        className={error ? 'border-red-500 focus:border-red-500' : ''}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
  required: (message: string = 'This field is required') => z.string().min(1, message),
};

// Form submission helpers
export async function submitWithValidation<T>(
  data: any,
  schema: z.ZodSchema<T>,
  submitFn: (validatedData: T) => Promise<any>
): Promise<{ success: boolean; data?: any; errors?: ValidationError[] }> {
  try {
    const validatedData = schema.parse(data);
    const result = await submitFn(validatedData);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      };
    }
    throw error;
  }
}
