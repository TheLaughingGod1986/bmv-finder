'use client';

import { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAccessibility } from '@/lib/accessibility/accessibilityManager';
import { accessibilityUtils } from '@/lib/accessibility/accessibilityManager';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: string) => string | null;
  };
}

interface AccessibleFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => void;
  submitLabel?: string;
  className?: string;
}

export default function AccessibleForm({ 
  fields, 
  onSubmit, 
  submitLabel = 'Submit',
  className = '' 
}: AccessibleFormProps) {
  const { announce } = useAccessibility();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLInputElement>(null);

  // Generate unique IDs for form fields
  const fieldIds = fields.reduce((acc, field) => {
    acc[field.id] = accessibilityUtils.generateId(`field-${field.id}`);
    return acc;
  }, {} as Record<string, string>);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const handleInputBlur = (fieldId: string) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));
    validateField(fieldId, formData[fieldId] || '');
  };

  const validateField = (fieldId: string, value: string): string | null => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return null;

    // Required validation
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value.trim() && !field.required) {
      return null;
    }

    // Type-specific validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (field.type === 'url' && value) {
      try {
        new URL(value);
      } catch {
        return 'Please enter a valid URL';
      }
    }

    if (field.type === 'tel' && value) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return 'Please enter a valid phone number';
      }
    }

    // Custom validation
    if (field.validation) {
      const { pattern, minLength, maxLength, min, max, custom } = field.validation;

      if (pattern && !new RegExp(pattern).test(value)) {
        return 'Please enter a valid format';
      }

      if (minLength && value.length < minLength) {
        return `Must be at least ${minLength} characters`;
      }

      if (maxLength && value.length > maxLength) {
        return `Must be no more than ${maxLength} characters`;
      }

      if (min !== undefined && parseFloat(value) < min) {
        return `Must be at least ${min}`;
      }

      if (max !== undefined && parseFloat(value) > max) {
        return `Must be no more than ${max}`;
      }

      if (custom) {
        const customError = custom(value);
        if (customError) return customError;
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    fields.forEach(field => {
      const error = validateField(field.id, formData[field.id] || '');
      if (error) {
        newErrors[field.id] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field.id]: true }), {}));

    if (hasErrors) {
      // Focus first error field
      const firstErrorField = fields.find(field => newErrors[field.id]);
      if (firstErrorField && firstErrorRef.current) {
        firstErrorRef.current.focus();
        announce(`Form validation failed. ${firstErrorField.label}: ${newErrors[firstErrorField.id]}`, 'assertive');
      }
    }

    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (validateForm()) {
      try {
        await onSubmit(formData);
        announce('Form submitted successfully', 'polite');
      } catch (error) {
        announce('Form submission failed. Please try again.', 'assertive');
      }
    } else {
      announce('Please correct the errors and try again', 'assertive');
    }

    setIsSubmitting(false);
  };

  const togglePasswordVisibility = (fieldId: string) => {
    setShowPasswords(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const renderField = (field: FormField) => {
    const fieldId = fieldIds[field.id];
    const hasError = touched[field.id] && errors[field.id];
    const isPassword = field.type === 'password';
    const showPassword = showPasswords[field.id];

    const commonProps = {
      id: fieldId,
      name: field.id,
      value: formData[field.id] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleInputChange(field.id, e.target.value),
      onBlur: () => handleInputBlur(field.id),
      required: field.required,
      placeholder: field.placeholder,
      'aria-describedby': field.description ? `${fieldId}-description` : undefined,
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-required': field.required ? 'true' : 'false',
      className: `w-full px-3 py-2 border rounded-lg transition-colors ${
        hasError 
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`,
    };

    return (
      <div key={field.id} className="space-y-2">
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {field.label}
          {field.required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>

        <div className="relative">
          {field.type === 'textarea' ? (
            <textarea
              {...commonProps}
              rows={4}
              ref={hasError ? firstErrorRef : undefined}
            />
          ) : field.type === 'select' ? (
            <select
              {...commonProps}
              ref={hasError ? firstErrorRef : undefined}
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              {...commonProps}
              type={isPassword && showPassword ? 'text' : field.type}
              ref={hasError ? firstErrorRef : undefined}
            />
          )}

          {isPassword && (
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.id)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>

        {field.description && (
          <p 
            id={`${fieldId}-description`}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {field.description}
          </p>
        )}

        {hasError && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errors[field.id]}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
      aria-label="Accessible form"
    >
      {fields.map(renderField)}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
          aria-describedby="submit-description"
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>

        <p id="submit-description" className="text-sm text-gray-600 dark:text-gray-400">
          {isSubmitting ? 'Please wait while we process your request' : 'Press Enter to submit'}
        </p>
      </div>

      {/* Form Status */}
      {Object.keys(errors).length > 0 && (
        <div 
          role="alert"
          aria-live="polite"
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Please correct the following errors:
            </h3>
          </div>
          <ul className="mt-2 space-y-1">
            {Object.entries(errors).map(([fieldId, error]) => (
              <li key={fieldId} className="text-sm text-red-700 dark:text-red-300">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
