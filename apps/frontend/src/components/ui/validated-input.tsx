'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sanitizeInput, fieldValidators } from '@/lib/validation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  validators?: Array<(value: string) => string | boolean>;
  sanitizer?: (value: string) => string;
  showValidation?: boolean;
  onValidChange?: (isValid: boolean, value: string) => void;
  errorMessage?: string;
  successMessage?: string;
}

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  validators?: Array<(value: string) => string | boolean>;
  sanitizer?: (value: string) => string;
  showValidation?: boolean;
  onValidChange?: (isValid: boolean, value: string) => void;
  errorMessage?: string;
  successMessage?: string;
}

export function ValidatedInput({
  label,
  validators = [],
  sanitizer = sanitizeInput.text,
  showValidation = true,
  onValidChange,
  errorMessage: externalError,
  successMessage,
  className = '',
  onChange,
  value,
  defaultValue,
  ...props
}: ValidatedInputProps) {
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState(true);
  const [touched, setTouched] = useState(false);

  // Update internal value when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const validateInput = (inputValue: string) => {
    // Run all validators
    for (const validator of validators) {
      const result = validator(inputValue);
      if (result !== true) {
        setError(typeof result === 'string' ? result : 'Invalid input');
        setIsValid(false);
        onValidChange?.(false, inputValue);
        return false;
      }
    }

    setError('');
    setIsValid(true);
    onValidChange?.(true, inputValue);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizer(rawValue);
    
    setInternalValue(sanitizedValue);
    setTouched(true);

    // Validate the sanitized value
    validateInput(sanitizedValue);

    // Call external onChange with sanitized value
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: sanitizedValue }
      };
      onChange(syntheticEvent);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateInput(internalValue.toString());
  };

  const displayError = externalError || error;
  const showError = touched && showValidation && displayError;
  const showSuccess = touched && showValidation && isValid && !displayError && successMessage;

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id || props.name} className="text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          {...props}
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            ${className}
            ${showError ? 'border-red-500 focus:ring-red-500' : ''}
            ${showSuccess ? 'border-green-500 focus:ring-green-500' : ''}
            ${showValidation ? 'pr-10' : ''}
          `}
        />
        
        {showValidation && (showError || showSuccess) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {showError && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {showSuccess && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>
        )}
      </div>

      {showError && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {displayError}
        </p>
      )}
      
      {showSuccess && (
        <p className="text-sm text-green-600 flex items-center">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          {successMessage}
        </p>
      )}
    </div>
  );
}

export function ValidatedTextarea({
  label,
  validators = [],
  sanitizer = sanitizeInput.richText,
  showValidation = true,
  onValidChange,
  errorMessage: externalError,
  successMessage,
  className = '',
  onChange,
  value,
  defaultValue,
  ...props
}: ValidatedTextareaProps) {
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState(true);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const validateInput = (inputValue: string) => {
    for (const validator of validators) {
      const result = validator(inputValue);
      if (result !== true) {
        setError(typeof result === 'string' ? result : 'Invalid input');
        setIsValid(false);
        onValidChange?.(false, inputValue);
        return false;
      }
    }

    setError('');
    setIsValid(true);
    onValidChange?.(true, inputValue);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizer(rawValue);
    
    setInternalValue(sanitizedValue);
    setTouched(true);

    validateInput(sanitizedValue);

    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: sanitizedValue }
      };
      onChange(syntheticEvent);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateInput(internalValue.toString());
  };

  const displayError = externalError || error;
  const showError = touched && showValidation && displayError;
  const showSuccess = touched && showValidation && isValid && !displayError && successMessage;

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id || props.name} className="text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Textarea
          {...props}
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            ${className}
            ${showError ? 'border-red-500 focus:ring-red-500' : ''}
            ${showSuccess ? 'border-green-500 focus:ring-green-500' : ''}
          `}
        />
      </div>

      {showError && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {displayError}
        </p>
      )}
      
      {showSuccess && (
        <p className="text-sm text-green-600 flex items-center">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          {successMessage}
        </p>
      )}
    </div>
  );
}

// Pre-configured input components for common use cases
export function EmailInput(props: Omit<ValidatedInputProps, 'validators' | 'sanitizer'>) {
  return (
    <ValidatedInput
      {...props}
      type="email"
      validators={[fieldValidators.email]}
      sanitizer={sanitizeInput.email}
      successMessage="Valid email address"
    />
  );
}

export function PhoneInput(props: Omit<ValidatedInputProps, 'validators' | 'sanitizer'>) {
  return (
    <ValidatedInput
      {...props}
      type="tel"
      validators={[fieldValidators.phone]}
      sanitizer={sanitizeInput.phone}
      successMessage="Valid phone number"
    />
  );
}

export function RequiredTextInput(props: ValidatedInputProps) {
  return (
    <ValidatedInput
      {...props}
      validators={[fieldValidators.required, ...(props.validators || [])]}
      required
    />
  );
}

export function NameInput(props: Omit<ValidatedInputProps, 'validators' | 'sanitizer'>) {
  return (
    <ValidatedInput
      {...props}
      validators={[
        fieldValidators.required,
        fieldValidators.alphaOnly,
        fieldValidators.maxLength(100)
      ]}
      sanitizer={sanitizeInput.text}
      required
      successMessage="Valid name"
    />
  );
}