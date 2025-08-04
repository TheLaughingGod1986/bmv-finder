'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressSuggestion {
  address: string;
  postcode: string;
  number: string;
  street: string;
  display: string;
}

interface DealCalculatorAddressInputProps {
  postcode: string;
  onPostcodeChange: (postcode: string) => void;
  address: string;
  onAddressChange: (address: string) => void;
  onAddressSelect?: (address: AddressSuggestion) => void;
  required?: boolean;
  className?: string;
}

// UK postcode regex
const POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]? ?[0-9][A-Z]{2}$/i;

const DealCalculatorAddressInput: React.FC<DealCalculatorAddressInputProps> = ({
  postcode,
  onPostcodeChange,
  address,
  onAddressChange,
  onAddressSelect,
  required = false,
  className = ''
}) => {
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [addresses, setAddresses] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isValidPostcode, setIsValidPostcode] = useState(true);
  const postcodeInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Validate postcode format
  const validatePostcode = (value: string) => {
    if (!value.trim()) return true;
    return POSTCODE_REGEX.test(value.trim());
  };

  // Fetch addresses when postcode changes
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!postcode.trim() || !validatePostcode(postcode)) {
        setAddresses([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/address-suggestions?q=${encodeURIComponent(postcode.trim())}`);
        const data = await response.json();
        
        if (data.addresses && Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
        } else {
          setAddresses([]);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchAddresses, 500);
    return () => clearTimeout(timeoutId);
  }, [postcode]);

  // Handle postcode input change
  const handlePostcodeChange = (value: string) => {
    // Auto-format postcode (add space after first part)
    let formattedValue = value.toUpperCase();
    if (formattedValue.length > 3 && !formattedValue.includes(' ')) {
      const firstPart = formattedValue.slice(0, -3);
      const secondPart = formattedValue.slice(-3);
      formattedValue = `${firstPart} ${secondPart}`;
    }
    
    const isValid = validatePostcode(formattedValue);
    setIsValidPostcode(isValid);
    onPostcodeChange(formattedValue);
    
    // Clear address when postcode changes
    if (address) {
      onAddressChange('');
    }
  };

  // Handle address selection
  const handleAddressSelect = (selectedAddress: AddressSuggestion) => {
    onAddressChange(selectedAddress.display);
    onAddressSelect?.(selectedAddress);
    setShowAddressDropdown(false);
  };

  // Handle address input focus
  const handleAddressFocus = () => {
    if (addresses.length > 0) {
      setShowAddressDropdown(true);
    }
  };

  // Handle address input change
  const handleAddressChange = (value: string) => {
    onAddressChange(value);
    if (value && addresses.length > 0) {
      setShowAddressDropdown(true);
    } else {
      setShowAddressDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddressDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Postcode Input */}
      <div>
        <label className="block text-base font-semibold text-primary mb-1">
          Postcode{required && <span className="text-gold">*</span>}
        </label>
        <div className="relative">
          <input
            ref={postcodeInputRef}
            type="text"
            value={postcode}
            onChange={(e) => handlePostcodeChange(e.target.value)}
            placeholder="e.g., NE5 2PR"
            className={`w-full px-4 py-2 border-2 rounded-xl bg-beige text-primary focus:ring-2 focus:ring-gold transition-all text-base shadow-sm ${
              isValidPostcode ? 'border-taupe focus:border-gold' : 'border-red-300 focus:border-red-500'
            }`}
            maxLength={8}
          />
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        {!isValidPostcode && postcode && (
          <p className="text-red-500 text-sm mt-1">Please enter a valid UK postcode</p>
        )}
      </div>

      {/* Address Input */}
      <div>
        <label className="block text-base font-semibold text-primary mb-1">
          Property Address{required && <span className="text-gold">*</span>}
        </label>
        <div className="relative" ref={dropdownRef}>
          <input
            ref={addressInputRef}
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onFocus={handleAddressFocus}
            placeholder={postcode ? "Select an address or type manually" : "Enter postcode first"}
            disabled={!postcode.trim()}
            className={`w-full px-4 py-2 border-2 rounded-xl bg-beige text-primary focus:ring-2 focus:ring-gold transition-all text-base shadow-sm ${
              !postcode.trim() ? 'border-gray-300 bg-gray-100' : 'border-taupe focus:border-gold'
            }`}
            maxLength={120}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            {address && !loading && (
              <button
                type="button"
                onClick={() => onAddressChange('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {addresses.length > 0 && !loading && (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>

          {/* Address Dropdown */}
          <AnimatePresence>
            {showAddressDropdown && addresses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 w-full mt-1 bg-white border-2 border-taupe rounded-xl shadow-lg max-h-60 overflow-y-auto"
              >
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                    Available addresses in {postcode}:
                  </div>
                  {addresses.map((addr, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAddressSelect(addr)}
                      className="w-full text-left px-3 py-2 hover:bg-beige rounded-lg transition-colors text-sm"
                    >
                      <div className="font-medium text-primary">{addr.display}</div>
                      <div className="text-xs text-gray-500">{addr.postcode}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {postcode && addresses.length === 0 && !loading && (
          <p className="text-gray-500 text-sm mt-1">
            No addresses found for this postcode. You can type the address manually or try a different postcode.
          </p>
        )}
      </div>
    </div>
  );
};

export default DealCalculatorAddressInput; 