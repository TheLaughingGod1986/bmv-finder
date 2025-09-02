'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calculator, Home, PoundSterling, FileText, Percent, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Property {
  id: string;
  address: string;
  postcode: string;
  purchasePrice: number;
  currentValue?: number;
  monthlyRent?: number;
  rentStartDate?: string;
  mortgageBalance?: number;
  mortgageType?: 'repayment' | 'interest_only' | string;
  mortgageRate?: number;
  depositAmount?: number;
  monthlyAgentFee?: number;
  monthlyInsurance?: number;
  annualInsurance?: number;
  oneOffFees?: Fee[];
  scheduledFees?: Fee[];
  monthlyExpenses?: number;
  propertyNotes?: string;
  refurbishmentCosts?: { low: number; medium: number; high: number };
  selectedRefurbishmentLevel?: string;
  actualRefurbishmentCost?: number;
  stampDuty?: number;
  legalFees?: number;
  surveyFees?: number;
  mortgageFees?: number;
  landRegistryFees?: number;
  searchesFees?: number;
  gasSafetyCertificate?: number;
  electricalSafetyCertificate?: number;
  energyPerformanceCertificate?: number;
  fireSafetyAssessment?: number;
  legionellaRiskAssessment?: number;
  asbestosSurvey?: number;
  landlordInsurance?: number;
  furnitureAndAppliances?: number;
  marketingAndLettingFees?: number;
  contingencyFund?: number;
  offerHistory?: Offer[];
  [key: string]: unknown;
}

interface Fee {
  description: string;
  amount: number;
  frequency?: string;
  date?: string;
  [key: string]: unknown;
}

interface Offer {
  id: string;
  status: 'offer_made' | 'offer_accepted' | 'offer_rejected' | 'offer_withdrawn';
  amount: number;
  date: string;
  notes: string;
  outcome?: string;
  [key: string]: unknown;
}

interface PropertyEditModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProperty: Property) => Promise<void>;
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
    monthlyAgentFee: property?.monthlyAgentFee || 0,
    monthlyInsurance: property?.monthlyInsurance || 0,
    annualInsurance: property?.annualInsurance || 0,
    oneOffFees: property?.oneOffFees || [],
    scheduledFees: property?.scheduledFees || [],
    monthlyExpenses: property?.monthlyExpenses || 0,
    propertyNotes: property?.propertyNotes || '',
    
    // Renovation costs
    refurbishmentCosts: property?.refurbishmentCosts || { low: 0, medium: 0, high: 0 },
    selectedRefurbishmentLevel: property?.selectedRefurbishmentLevel || 'medium',
    actualRefurbishmentCost: property?.actualRefurbishmentCost || 0,
    
    // Legal and setup costs
    stampDuty: property?.stampDuty || 0,
    legalFees: property?.legalFees || 1500,
    surveyFees: property?.surveyFees || 500,
    mortgageFees: property?.mortgageFees || 1000,
    landRegistryFees: property?.landRegistryFees || 200,
    searchesFees: property?.searchesFees || 300,
    gasSafetyCertificate: property?.gasSafetyCertificate || 80,
    electricalSafetyCertificate: property?.electricalSafetyCertificate || 200,
    energyPerformanceCertificate: property?.energyPerformanceCertificate || 80,
    fireSafetyAssessment: property?.fireSafetyAssessment || 150,
    legionellaRiskAssessment: property?.legionellaRiskAssessment || 100,
    asbestosSurvey: property?.asbestosSurvey || 300,
    landlordInsurance: property?.landlordInsurance || 300,
    furnitureAndAppliances: property?.furnitureAndAppliances || 2000,
    marketingAndLettingFees: property?.marketingAndLettingFees || 500,
    contingencyFund: property?.contingencyFund || 1000,
    
    // Offer history
    offerHistory: property?.offerHistory || [],
  });

  // Temporary state for one-off fee inputs
  const [oneOffFeeInput, setOneOffFeeInput] = useState({ description: '', amount: '' });
  
  // Temporary state for offer history input
  const [offerHistoryInput, setOfferHistoryInput] = useState({ 
    status: 'offer_made', 
    amount: '', 
    date: '', 
    notes: '' 
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

  // Update form data when modal opens with a new property
  useEffect(() => {
    if (property && isOpen) {
      setFormData({
        monthlyRent: property.monthlyRent || 0,
        rentStartDate: property.rentStartDate || '',
        mortgageBalance: property.mortgageBalance || 0,
        mortgageType: property.mortgageType || 'repayment',
        mortgageRate: property.mortgageRate || 4.5,
        depositAmount: property.depositAmount || Math.round((property.purchasePrice || 0) * 0.25),
        depositPercentage: property.depositAmount ? Math.round((property.depositAmount / (property.purchasePrice || 1)) * 100) : 25,
        monthlyAgentFee: property.monthlyAgentFee || 0,
        monthlyInsurance: property.monthlyInsurance || 0,
        annualInsurance: property.annualInsurance || 0,
        oneOffFees: property.oneOffFees || [],
        scheduledFees: property.scheduledFees || [],
        monthlyExpenses: property.monthlyExpenses || 0,
        propertyNotes: property.propertyNotes || '',
        
        // Renovation costs
        refurbishmentCosts: property.refurbishmentCosts || { low: 0, medium: 0, high: 0 },
        selectedRefurbishmentLevel: property.selectedRefurbishmentLevel || 'medium',
        actualRefurbishmentCost: property.actualRefurbishmentCost || 0,
        
        // Legal and setup costs
        stampDuty: property.stampDuty || 0,
        legalFees: property.legalFees || 1500,
        surveyFees: property.surveyFees || 500,
        mortgageFees: property.mortgageFees || 1000,
        landRegistryFees: property.landRegistryFees || 200,
        searchesFees: property.searchesFees || 300,
        gasSafetyCertificate: property.gasSafetyCertificate || 80,
        electricalSafetyCertificate: property.electricalSafetyCertificate || 200,
        energyPerformanceCertificate: property.energyPerformanceCertificate || 80,
        fireSafetyAssessment: property.fireSafetyAssessment || 150,
        legionellaRiskAssessment: property.legionellaRiskAssessment || 100,
        asbestosSurvey: property.asbestosSurvey || 300,
        landlordInsurance: property.landlordInsurance || 300,
        furnitureAndAppliances: property.furnitureAndAppliances || 2000,
        marketingAndLettingFees: property.marketingAndLettingFees || 500,
        contingencyFund: property.contingencyFund || 1000,
        
        // Offer history
        offerHistory: property.offerHistory || [],
      });
      
      // Reset one-off fee input
      setOneOffFeeInput({ description: '', amount: '' });
      // Reset offer history input
      setOfferHistoryInput({ status: 'offer_made', amount: '', date: '', notes: '' });
    }
  }, [property?.id, isOpen]); // Only update when property ID changes or modal opens

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
  }, [formData, property?.currentValue, property?.purchasePrice]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddOneOffFee = () => {
    if (oneOffFeeInput.description && oneOffFeeInput.amount) {
      const newFee = {
        description: oneOffFeeInput.description,
        amount: parseFloat(oneOffFeeInput.amount),
        date: new Date().toISOString().split('T')[0]
      };
      
      setFormData(prev => ({
        ...prev,
        oneOffFees: [...prev.oneOffFees, newFee]
      }));
      
      // Clear the input fields
      setOneOffFeeInput({ description: '', amount: '' });
    }
  };

  const handleRemoveOneOffFee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      oneOffFees: prev.oneOffFees.filter((_, i) => i !== index)
    }));
  };

  const handleAddOfferHistory = () => {
    if (offerHistoryInput.amount && offerHistoryInput.date) {
      const newOffer: Offer = {
        id: Date.now().toString(),
        status: offerHistoryInput.status as 'offer_made' | 'offer_accepted' | 'offer_rejected' | 'offer_withdrawn',
        amount: parseFloat(offerHistoryInput.amount),
        date: offerHistoryInput.date,
        notes: offerHistoryInput.notes,
        outcome: offerHistoryInput.status === 'offer_accepted' ? 'Accepted' : 
                offerHistoryInput.status === 'offer_rejected' ? 'Rejected' : 'Pending'
      };
      
      setFormData(prev => ({
        ...prev,
        offerHistory: [...prev.offerHistory, newOffer]
      }));
      
      // Clear the input fields
      setOfferHistoryInput({ status: 'offer_made', amount: '', date: '', notes: '' });
    }
  };

  const handleRemoveOfferHistory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      offerHistory: prev.offerHistory.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalInvestmentCost = () => {
    let total = formData.depositAmount || 0;
    
    // Add one-off fees (mirroring portfolio calculation)
    if (formData.oneOffFees && Array.isArray(formData.oneOffFees)) {
      total += formData.oneOffFees.reduce((feeSum: number, fee: Fee) => feeSum + (fee.amount || 0), 0);
    }
    
    // Add scheduled fees (one-time only) - mirroring portfolio calculation
    if (formData.scheduledFees && Array.isArray(formData.scheduledFees)) {
      total += formData.scheduledFees
              .filter((fee: Fee) => fee.frequency === 'one_time')
      .reduce((feeSum: number, fee: Fee) => feeSum + (fee.amount || 0), 0);
    }
    
    // Add renovation costs
    const refurbishmentCost = formData.actualRefurbishmentCost || 
                             formData.refurbishmentCosts?.[formData.selectedRefurbishmentLevel] || 0;
    total += refurbishmentCost;
    
    // Add legal and setup costs (mirroring portfolio calculation exactly)
    total += formData.stampDuty || 0;
    total += formData.legalFees || 0;
    total += formData.surveyFees || 0;
    total += formData.mortgageFees || 0;
    total += formData.landRegistryFees || 0;
    total += formData.searchesFees || 0;
    total += formData.gasSafetyCertificate || 0;
    total += formData.electricalSafetyCertificate || 0;
    total += formData.energyPerformanceCertificate || 0;
    total += formData.fireSafetyAssessment || 0;
    total += formData.legionellaRiskAssessment || 0;
    total += formData.asbestosSurvey || 0;
    total += formData.landlordInsurance || 0;
    total += formData.furnitureAndAppliances || 0;
    total += formData.marketingAndLettingFees || 0;
    total += formData.contingencyFund || 0;
    
    return {
      deposit: formData.depositAmount || 0,
      stampDuty: formData.stampDuty || 0,
      refurbishmentCost,
      totalSetupCosts: (formData.legalFees || 0) + (formData.surveyFees || 0) + (formData.mortgageFees || 0) + 
                      (formData.landRegistryFees || 0) + (formData.searchesFees || 0) + (formData.gasSafetyCertificate || 0) + 
                      (formData.electricalSafetyCertificate || 0) + (formData.energyPerformanceCertificate || 0) + 
                      (formData.fireSafetyAssessment || 0) + (formData.legionellaRiskAssessment || 0) + 
                      (formData.asbestosSurvey || 0) + (formData.landlordInsurance || 0) + 
                      (formData.furnitureAndAppliances || 0) + (formData.marketingAndLettingFees || 0) + 
                      (formData.contingencyFund || 0),
      totalInvestmentCost: total
    };
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
        monthly_agent_fee: formData.monthlyAgentFee || 0,
        monthly_insurance: formData.monthlyInsurance || 0,
        annual_insurance: formData.annualInsurance || 0,
        one_off_fees: formData.oneOffFees || [],
        scheduled_fees: formData.scheduledFees || [],
        monthly_expenses: formData.monthlyExpenses || 0,
        property_notes: formData.propertyNotes || '',
        yield: calculatedValues.yield || 0,
        equity: calculatedValues.equity || 0,
        equity_percentage: calculatedValues.equityPercentage || 0,
        monthly_profit: calculatedValues.monthlyProfit || 0,
        rental_income: (formData.monthlyRent || 0) * 12, // Also update annual rental income
        
        // Renovation costs
        refurbishment_costs: formData.refurbishmentCosts || { low: 0, medium: 0, high: 0 },
        selected_refurbishment_level: formData.selectedRefurbishmentLevel || 'medium',
        actual_refurbishment_cost: formData.actualRefurbishmentCost || 0,
        
        // Legal and setup costs
        stamp_duty: formData.stampDuty || 0,
        legal_fees: formData.legalFees || 0,
        survey_fees: formData.surveyFees || 0,
        mortgage_fees: formData.mortgageFees || 0,
        land_registry_fees: formData.landRegistryFees || 0,
        searches_fees: formData.searchesFees || 0,
        gas_safety_certificate: formData.gasSafetyCertificate || 0,
        electrical_safety_certificate: formData.electricalSafetyCertificate || 0,
        energy_performance_certificate: formData.energyPerformanceCertificate || 0,
        fire_safety_assessment: formData.fireSafetyAssessment || 0,
        legionella_risk_assessment: formData.legionellaRiskAssessment || 0,
        asbestos_survey: formData.asbestosSurvey || 0,
        landlord_insurance: formData.landlordInsurance || 0,
        furniture_and_appliances: formData.furnitureAndAppliances || 0,
        marketing_and_letting_fees: formData.marketingAndLettingFees || 0,
        contingency_fund: formData.contingencyFund || 0,
        
        // Offer history
        offer_history: formData.offerHistory || [],
      };
      
      
      // Handle case where Supabase is not available (demo mode)
      if (!supabase) {
        console.log('Supabase not available - using mock save');
        // In demo mode, just update the local property data
        const updatedProperty = {
          ...property,
          monthlyRent: formData.monthlyRent,
          rentStartDate: formData.rentStartDate,
          mortgageBalance: formData.mortgageBalance,
          mortgageType: formData.mortgageType,
          mortgageRate: formData.mortgageRate,
          monthlyMortgagePayment: calculatedValues.monthlyMortgagePayment,
          depositAmount: formData.depositAmount,
          monthlyAgentFee: formData.monthlyAgentFee,
          monthlyInsurance: formData.monthlyInsurance,
          annualInsurance: formData.annualInsurance,
          oneOffFees: formData.oneOffFees,
          scheduledFees: formData.scheduledFees,
          monthlyExpenses: formData.monthlyExpenses,
          propertyNotes: formData.propertyNotes,
          yield: calculatedValues.yield,
          equity: calculatedValues.equity,
          equityPercentage: calculatedValues.equityPercentage,
          monthlyProfit: calculatedValues.monthlyProfit,
          
          // Renovation costs
          refurbishmentCosts: formData.refurbishmentCosts,
          selectedRefurbishmentLevel: formData.selectedRefurbishmentLevel,
          actualRefurbishmentCost: formData.actualRefurbishmentCost,
          
          // Legal and setup costs
          stampDuty: formData.stampDuty,
          legalFees: formData.legalFees,
          surveyFees: formData.surveyFees,
          mortgageFees: formData.mortgageFees,
          landRegistryFees: formData.landRegistryFees,
          searchesFees: formData.searchesFees,
          gasSafetyCertificate: formData.gasSafetyCertificate,
          electricalSafetyCertificate: formData.electricalSafetyCertificate,
          energyPerformanceCertificate: formData.energyPerformanceCertificate,
          fireSafetyAssessment: formData.fireSafetyAssessment,
          legionellaRiskAssessment: formData.legionellaRiskAssessment,
          asbestosSurvey: formData.asbestosSurvey,
          landlordInsurance: formData.landlordInsurance,
          furnitureAndAppliances: formData.furnitureAndAppliances,
          marketingAndLettingFees: formData.marketingAndLettingFees,
          contingencyFund: formData.contingencyFund,
          
          // Offer history
          offerHistory: formData.offerHistory,
        };

        await onSave(updatedProperty);
        alert('Property updated successfully! (Demo Mode)');
        onClose();
        return;
      }
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('portfolio_properties')
        .update(updateData)
        .eq('id', property.id)
        .select();
      

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

      // Create updated property object for both demo and real modes
      const updatedProperty = {
        ...property,
        monthlyRent: formData.monthlyRent,
        rentStartDate: formData.rentStartDate,
        mortgageBalance: formData.mortgageBalance,
        mortgageType: formData.mortgageType,
        mortgageRate: formData.mortgageRate,
        monthlyMortgagePayment: calculatedValues.monthlyMortgagePayment,
        depositAmount: formData.depositAmount,
        monthlyAgentFee: formData.monthlyAgentFee,
        monthlyInsurance: formData.monthlyInsurance,
        annualInsurance: formData.annualInsurance,
        oneOffFees: formData.oneOffFees,
        scheduledFees: formData.scheduledFees,
        monthlyExpenses: formData.monthlyExpenses,
        propertyNotes: formData.propertyNotes,
        yield: calculatedValues.yield,
        equity: calculatedValues.equity,
        equityPercentage: calculatedValues.equityPercentage,
        monthlyProfit: calculatedValues.monthlyProfit,
        
        // Renovation costs
        refurbishmentCosts: formData.refurbishmentCosts,
        selectedRefurbishmentLevel: formData.selectedRefurbishmentLevel,
        actualRefurbishmentCost: formData.actualRefurbishmentCost,
        
        // Legal and setup costs
        stampDuty: formData.stampDuty,
        legalFees: formData.legalFees,
        surveyFees: formData.surveyFees,
        mortgageFees: formData.mortgageFees,
        landRegistryFees: formData.landRegistryFees,
        searchesFees: formData.searchesFees,
        gasSafetyCertificate: formData.gasSafetyCertificate,
        electricalSafetyCertificate: formData.electricalSafetyCertificate,
        energyPerformanceCertificate: formData.energyPerformanceCertificate,
        fireSafetyAssessment: formData.fireSafetyAssessment,
        legionellaRiskAssessment: formData.legionellaRiskAssessment,
        asbestosSurvey: formData.asbestosSurvey,
        landlordInsurance: formData.landlordInsurance,
        furnitureAndAppliances: formData.furnitureAndAppliances,
        marketingAndLettingFees: formData.marketingAndLettingFees,
        contingencyFund: formData.contingencyFund,
        
        // Offer history
        offerHistory: formData.offerHistory,
      };

      await onSave(updatedProperty);
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {property?.address && property.address.includes(',') 
                ? property.address.split(',')[0].trim() 
                : property?.address}
            </h3>
            <p className="text-gray-600">{property?.postcode}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rental Income Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <PoundSterling className="w-5 h-5 text-green-600" />
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

                {/* Enhanced Fee Management Section */}
                <div className="col-span-2">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Fee Management
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Monthly Agent Fees */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Agent Fee (£)
                      </label>
                      <input
                        type="number"
                        value={formData.monthlyAgentFee || 0}
                        onChange={(e) => handleInputChange('monthlyAgentFee', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Recurring monthly agent management fee</p>
                    </div>

                    {/* Insurance Fees */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monthly Insurance (£)
                        </label>
                        <input
                          type="number"
                          value={formData.monthlyInsurance || 0}
                          onChange={(e) => handleInputChange('monthlyInsurance', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Annual Insurance (£)
                        </label>
                        <input
                          type="number"
                          value={formData.annualInsurance || 0}
                          onChange={(e) => handleInputChange('annualInsurance', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* One-off Fees */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        One-off Fees (£)
                      </label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={oneOffFeeInput.description}
                            onChange={(e) => setOneOffFeeInput(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Fee description (e.g., Refurbishment)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="number"
                            value={oneOffFeeInput.amount}
                            onChange={(e) => setOneOffFeeInput(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="Amount"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button 
                            type="button"
                            onClick={handleAddOneOffFee}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Add
                          </button>
                        </div>
                        
                        {/* Display added fees */}
                        {formData.oneOffFees.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-gray-700">Added Fees:</p>
                            {formData.oneOffFees.map((fee, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                <div>
                                  <span className="text-sm font-medium">{fee.description}</span>
                                  <span className="text-sm text-gray-500 ml-2">£{fee.amount}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOneOffFee(index)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scheduled Fees */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scheduled Fees
                      </label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Fee description (e.g., Insurance)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="number"
                            placeholder="Amount"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                            <option value="specific">Specific Date</option>
                          </select>
                          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Schedule
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Other Monthly Expenses */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Other Monthly Expenses (£)
                      </label>
                      <input
                        type="number"
                        value={formData.monthlyExpenses}
                        onChange={(e) => handleInputChange('monthlyExpenses', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Other recurring monthly expenses (utilities, maintenance, etc.)</p>
                    </div>
                  </div>
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

            {/* Renovation Costs Section */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-orange-600" />
                Renovation Costs
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refurbishment Level
                  </label>
                  <select
                    value={formData.selectedRefurbishmentLevel}
                    onChange={(e) => handleInputChange('selectedRefurbishmentLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="light">Light Refurbishment</option>
                    <option value="medium">Medium Refurbishment</option>
                    <option value="high">High Refurbishment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Refurbishment Cost (£)
                  </label>
                  <input
                    type="number"
                    value={formData.actualRefurbishmentCost}
                    onChange={(e) => handleInputChange('actualRefurbishmentCost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Light Refurbishment</div>
                  <div className="text-lg font-semibold text-orange-600">
                    £{formData.refurbishmentCosts?.low?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Medium Refurbishment</div>
                  <div className="text-lg font-semibold text-orange-600">
                    £{formData.refurbishmentCosts?.medium?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">High Refurbishment</div>
                  <div className="text-lg font-semibold text-orange-600">
                    £{formData.refurbishmentCosts?.high?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Legal & Setup Costs Section */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                Legal & Setup Costs
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stamp Duty (£)
                  </label>
                  <input
                    type="number"
                    value={formData.stampDuty}
                    onChange={(e) => handleInputChange('stampDuty', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Fees (£)
                  </label>
                  <input
                    type="number"
                    value={formData.legalFees}
                    onChange={(e) => handleInputChange('legalFees', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Survey Fees (£)
                  </label>
                  <input
                    type="number"
                    value={formData.surveyFees}
                    onChange={(e) => handleInputChange('surveyFees', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mortgage Fees (£)
                  </label>
                  <input
                    type="number"
                    value={formData.mortgageFees}
                    onChange={(e) => handleInputChange('mortgageFees', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Land Registry Fees (£)
                  </label>
                  <input
                    type="number"
                    value={formData.landRegistryFees}
                    onChange={(e) => handleInputChange('landRegistryFees', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Searches Fees (£)
                  </label>
                  <input
                    type="number"
                    value={formData.searchesFees}
                    onChange={(e) => handleInputChange('searchesFees', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gas Safety Certificate (£)
                  </label>
                  <input
                    type="number"
                    value={formData.gasSafetyCertificate}
                    onChange={(e) => handleInputChange('gasSafetyCertificate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="80"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Electrical Safety Certificate (£)
                  </label>
                  <input
                    type="number"
                    value={formData.electricalSafetyCertificate}
                    onChange={(e) => handleInputChange('electricalSafetyCertificate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Energy Performance Certificate (£)
                  </label>
                  <input
                    type="number"
                    value={formData.energyPerformanceCertificate}
                    onChange={(e) => handleInputChange('energyPerformanceCertificate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="80"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fire Safety Assessment (£)
                  </label>
                  <input
                    type="number"
                    value={formData.fireSafetyAssessment}
                    onChange={(e) => handleInputChange('fireSafetyAssessment', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legionella Risk Assessment (£)
                  </label>
                  <input
                    type="number"
                    value={formData.legionellaRiskAssessment}
                    onChange={(e) => handleInputChange('legionellaRiskAssessment', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asbestos Survey (£)
                  </label>
                  <input
                    type="number"
                    value={formData.asbestosSurvey}
                    onChange={(e) => handleInputChange('asbestosSurvey', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Landlord Insurance (£)
                  </label>
                  <input
                    type="number"
                    value={formData.landlordInsurance}
                    onChange={(e) => handleInputChange('landlordInsurance', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Furniture & Appliances (£)
                  </label>
                  <input
                    type="number"
                    value={formData.furnitureAndAppliances}
                    onChange={(e) => handleInputChange('furnitureAndAppliances', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marketing & Letting Fees (£)
                  </label>
                  <input
                    type="number"
                    value={formData.marketingAndLettingFees}
                    onChange={(e) => handleInputChange('marketingAndLettingFees', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contingency Fund (£)
                  </label>
                  <input
                    type="number"
                    value={formData.contingencyFund}
                    onChange={(e) => handleInputChange('contingencyFund', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Total Investment Cost Summary */}
              <div className="mt-4 bg-purple-50 p-4 rounded-lg">
                <h5 className="text-lg font-semibold text-purple-900 mb-3">Total Investment Cost Breakdown</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Deposit:</span>
                      <span className="font-medium">£{formData.depositAmount?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Stamp Duty:</span>
                      <span className="font-medium">£{formData.stampDuty?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Refurbishment:</span>
                      <span className="font-medium">£{(formData.actualRefurbishmentCost || formData.refurbishmentCosts?.[formData.selectedRefurbishmentLevel] || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Setup Costs:</span>
                      <span className="font-medium">£{calculateTotalInvestmentCost().totalSetupCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-semibold text-purple-900">Total Investment:</span>
                      <span className="font-bold text-purple-900">£{calculateTotalInvestmentCost().totalInvestmentCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offer History Section */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-red-600" />
                Offer History
              </h4>
              
              {/* Add New Offer */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="text-md font-medium text-gray-900 mb-3">Add New Offer</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={offerHistoryInput.status}
                      onChange={(e) => setOfferHistoryInput(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="offer_made">Offer Made</option>
                      <option value="offer_accepted">Offer Accepted</option>
                      <option value="offer_rejected">Offer Rejected</option>
                      <option value="offer_withdrawn">Offer Withdrawn</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (£)</label>
                    <input
                      type="number"
                      value={offerHistoryInput.amount}
                      onChange={(e) => setOfferHistoryInput(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={offerHistoryInput.date}
                      onChange={(e) => setOfferHistoryInput(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={handleAddOfferHistory}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Add Offer
                    </button>
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={offerHistoryInput.notes}
                    onChange={(e) => setOfferHistoryInput(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about this offer..."
                  />
                </div>
              </div>

              {/* Existing Offers */}
              {formData.offerHistory && formData.offerHistory.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-md font-medium text-gray-900">Previous Offers</h5>
                  {formData.offerHistory.map((offer: Offer, index: number) => (
                    <div key={offer.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              offer.status === 'offer_accepted' ? 'bg-green-100 text-green-800' :
                              offer.status === 'offer_rejected' ? 'bg-red-100 text-red-800' :
                              offer.status === 'offer_withdrawn' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {offer.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-lg font-semibold text-gray-900">£{offer.amount?.toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span> {new Date(offer.date).toLocaleDateString()}
                          </div>
                          {offer.notes && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Notes:</span> {offer.notes}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveOfferHistory(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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