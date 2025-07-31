'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calculator, Home, DollarSign, FileText, Percent, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface PropertyEditModalProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProperty: any) => void;
}

export default function PropertyEditModal({ property, isOpen, onClose, onSave }: PropertyEditModalProps) {
  const [formData, setFormData] = useState({
    monthlyRent: property?.monthlyRent || 0,
    rentStartDate: property?.rentStartDate || '',
    mortgageBalance: property?.mortgageBalance || 0,
    mortgageType: property?.mortgageType || 'repayment',
    mortgageRate: property?.mortgageRate || 4.5,
    depositAmount: property?.depositAmount || Math.round((property?.purchasePrice || 0) * 0.25),
    depositPercentage: property?.depositAmount ? Math.round((property.depositAmount / (property.purchasePrice || 1)) * 100) : 25,
    agentFees: property?.agentFees || 0,
    otherFees: property?.otherFees || 0,
    monthlyExpenses: property?.monthlyExpenses || 0,
    propertyNotes: property?.propertyNotes || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    monthlyMortgagePayment: 0,
    yield: 0,
    equity: 0,
    equityPercentage: 0,
    monthlyProfit: 0,
    rentDuration: '',
    totalIncome: 0,
  });

  // Update form data when property changes
  useEffect(() => {
    if (property) {
      setFormData({
        monthlyRent: property.monthlyRent || 0,
        rentStartDate: property.rentStartDate || '',
        mortgageBalance: property.mortgageBalance || 0,
        mortgageType: property.mortgageType || 'repayment',
        mortgageRate: property.mortgageRate || 4.5,
        depositAmount: property.depositAmount || Math.round((property.purchasePrice || 0) * 0.25),
        depositPercentage: property.depositAmount ? Math.round((property.depositAmount / (property.purchasePrice || 1)) * 100) : 25,
        agentFees: property.agentFees || 0,
        otherFees: property.otherFees || 0,
        monthlyExpenses: property.monthlyExpenses || 0,
        propertyNotes: property.propertyNotes || '',
      });
    }
  }, [property]);

  // Calculate derived values when form data changes
  useEffect(() => {
    const currentValue = property?.currentValue || 0;
    const purchasePrice = property?.purchasePrice || 0;
    const monthlyRent = formData.monthlyRent || 0;
    const mortgageBalance = formData.mortgageBalance || 0;
    const mortgageRate = formData.mortgageRate || 4.5;
    const monthlyExpenses = formData.monthlyExpenses || 0;
    
    // Calculate monthly mortgage payment (simplified calculation)
    const monthlyRate = mortgageRate / 100 / 12;
    const monthlyMortgagePayment = mortgageBalance > 0 ? 
      (formData.mortgageType === 'interest_only' ? 
        mortgageBalance * monthlyRate : 
        mortgageBalance * (monthlyRate * Math.pow(1 + monthlyRate, 300)) / (Math.pow(1 + monthlyRate, 300) - 1)
      ) : 0;
    
    // Calculate yield
    const annualRent = monthlyRent * 12;
    const yieldPercentage = currentValue > 0 ? (annualRent / currentValue) * 100 : 0;
    
    // Calculate equity (deposit + growth)
    const depositAmount = formData.depositAmount || (purchasePrice * 0.25); // Default 25% deposit
    const valueGrowth = currentValue - purchasePrice;
    const equity = depositAmount + valueGrowth;
    const equityPercentage = currentValue > 0 ? (equity / currentValue) * 100 : 0;
    
    // Calculate monthly profit
    const monthlyProfit = monthlyRent - monthlyMortgagePayment - monthlyExpenses;
    
    // Calculate total income
    const totalIncome = annualRent + valueGrowth;
           
           // Calculate rent duration
           let rentDuration = 'Not set';
    if (formData.rentStartDate) {
      try {
        const rentStart = new Date(formData.rentStartDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - rentStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
          rentDuration = `${diffDays} days`;
        } else if (diffDays < 365) {
          const months = Math.floor(diffDays / 30);
          rentDuration = `${months} month${months !== 1 ? 's' : ''}`;
        } else {
          const years = Math.floor(diffDays / 365);
          const remainingMonths = Math.floor((diffDays % 365) / 30);
          if (remainingMonths === 0) {
            rentDuration = `${years} year${years !== 1 ? 's' : ''}`;
          } else {
            rentDuration = `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
          }
        }
      } catch (error) {
        rentDuration = 'Invalid date';
      }
    }
    
               setCalculatedValues({
             monthlyMortgagePayment: Math.round(monthlyMortgagePayment * 100) / 100,
             yield: Math.round(yieldPercentage * 100) / 100,
             equity: Math.round(equity * 100) / 100,
             equityPercentage: Math.round(equityPercentage * 100) / 100,
             monthlyProfit: Math.round(monthlyProfit * 100) / 100,
             rentDuration,
             totalIncome: Math.round(totalIncome * 100) / 100,
           });
  }, [formData, property]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!property?.id) return;
    
    setIsSaving(true);
    try {
      const updateData = {
        monthly_rent: formData.monthlyRent || 0,
        rent_start_date: formData.rentStartDate || null,
        mortgage_balance: formData.mortgageBalance || 0,
        mortgage_type: formData.mortgageType || 'repayment',
        mortgage_rate: (formData.mortgageRate || 0) / 100,
        monthly_mortgage_payment: calculatedValues.monthlyMortgagePayment || 0,
        deposit_amount: formData.depositAmount || 0,
        agent_fees: formData.agentFees || 0,
        other_fees: formData.otherFees || 0,
        monthly_expenses: formData.monthlyExpenses || 0,
        property_notes: formData.propertyNotes || '',
        yield: calculatedValues.yield || 0,
        equity: calculatedValues.equity || 0,
        rental_income: (formData.monthlyRent || 0) * 12, // Also update annual rental income
      };
      
      console.log('Updating property with data:', updateData);
      console.log('Property ID:', property.id);
      console.log('Supabase client:', supabase ? 'Available' : 'Not available');
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      console.log('Auth error:', authError);
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('portfolio_properties')
        .update(updateData)
        .eq('id', property.id)
        .select();
      
      console.log('Update response data:', data);
      console.log('Update response error:', error);

      if (error) {
        console.error('Error updating property:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Failed to update property: ${error.message || 'Unknown error'}. Please try again.`);
        return;
      }

      const updatedProperty = {
        ...property,
        monthlyRent: formData.monthlyRent,
        rentStartDate: formData.rentStartDate,
        mortgageBalance: formData.mortgageBalance,
        mortgageType: formData.mortgageType,
        mortgageRate: formData.mortgageRate,
        monthlyMortgagePayment: calculatedValues.monthlyMortgagePayment,
        depositAmount: formData.depositAmount,
        agentFees: formData.agentFees,
        otherFees: formData.otherFees,
        monthlyExpenses: formData.monthlyExpenses,
        propertyNotes: formData.propertyNotes,
        yield: calculatedValues.yield,
        equity: calculatedValues.equity,
        equityPercentage: calculatedValues.equityPercentage,
        monthlyProfit: calculatedValues.monthlyProfit,
      };

      onSave(updatedProperty);
      alert('Property updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save property: ${errorMessage}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Edit Property Details</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Property Info */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{property?.address}</h3>
            <p className="text-gray-600">{property?.postcode}</p>
            {property?.address && property.address.includes(',') && property.address.split(',').length > 2 && (
              <p className="text-sm text-gray-500 mt-1">
                Full Address: {property.address}
              </p>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rental Income Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Rental Income
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent (£)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rent Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.rentStartDate}
                    onChange={(e) => handleInputChange('rentStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Annual Yield:</span>
                    <span className="text-lg font-semibold text-green-600">{calculatedValues.yield}%</span>
                  </div>
                </div>
              </div>

              {/* Mortgage Details Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Mortgage Details
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mortgage Balance (£)
                  </label>
                  <input
                    type="number"
                    value={formData.mortgageBalance}
                    onChange={(e) => handleInputChange('mortgageBalance', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mortgage Type
                  </label>
                  <select
                    value={formData.mortgageType}
                    onChange={(e) => handleInputChange('mortgageType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="repayment">Repayment</option>
                    <option value="interest_only">Interest Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.mortgageRate}
                    onChange={(e) => handleInputChange('mortgageRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="4.5"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Monthly Payment:</span>
                    <span className="text-lg font-semibold text-blue-600">£{calculatedValues.monthlyMortgagePayment.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Financial Details Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-purple-600" />
                  Financial Details
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.depositPercentage}
                    onChange={(e) => {
                      const percentage = parseFloat(e.target.value) || 0;
                      const amount = Math.round((property?.purchasePrice || 0) * (percentage / 100));
                      handleInputChange('depositPercentage', percentage);
                      handleInputChange('depositAmount', amount);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Amount (£)
                  </label>
                  <input
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      const percentage = property?.purchasePrice ? Math.round((amount / property.purchasePrice) * 100 * 10) / 10 : 0;
                      handleInputChange('depositAmount', amount);
                      handleInputChange('depositPercentage', percentage);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Fees (£)
                  </label>
                  <input
                    type="number"
                    value={formData.agentFees}
                    onChange={(e) => handleInputChange('agentFees', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Fees (£)
                  </label>
                  <input
                    type="number"
                    value={formData.otherFees}
                    onChange={(e) => handleInputChange('otherFees', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Expenses (£)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyExpenses}
                    onChange={(e) => handleInputChange('monthlyExpenses', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Calculated Values Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-600" />
                  Calculated Values
                </h4>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Equity:</span>
                      <span className="text-lg font-semibold text-green-600">£{calculatedValues.equity.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Equity %:</span>
                      <span className="text-lg font-semibold text-blue-600">{calculatedValues.equityPercentage}%</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Monthly Profit:</span>
                      <span className={`text-lg font-semibold ${calculatedValues.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        £{calculatedValues.monthlyProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                                         <div className="bg-gray-50 p-3 rounded-lg">
                         <div className="flex justify-between items-center">
                           <span className="text-sm font-medium text-gray-700">Rent Duration:</span>
                           <span className="text-lg font-semibold text-orange-600">{calculatedValues.rentDuration}</span>
                         </div>
                       </div>
                       
                       <div className="bg-indigo-50 p-3 rounded-lg">
                         <div className="flex justify-between items-center">
                           <span className="text-sm font-medium text-gray-700">Total Income:</span>
                           <span className="text-lg font-semibold text-indigo-600">£{calculatedValues.totalIncome.toLocaleString()}</span>
                         </div>
                       </div>
                       
                       <div className="bg-gray-50 p-3 rounded-lg">
                         <div className="flex justify-between items-center">
                           <span className="text-sm font-medium text-gray-700">Purchase Price:</span>
                           <span className="text-lg font-semibold text-gray-700">£{property?.purchasePrice?.toLocaleString() || 'N/A'}</span>
                         </div>
                       </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-gray-600" />
                Property Notes
              </h4>
              <textarea
                value={formData.propertyNotes}
                onChange={(e) => handleInputChange('propertyNotes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add notes about this property..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 