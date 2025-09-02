'use client';

import { motion } from 'framer-motion';
import { Home, TrendingUp, PoundSterling, Calendar, Edit, CheckCircle, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { formatPrice } from '@/lib/formatters';

interface Property {
  id: string;
  address: string;
  postcode: string;
  propertyType: string;
  bedrooms?: number;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  monthlyRent?: number;
  monthlyMortgagePayment?: number;
  monthlyExpenses?: number;
  monthlyAgentFee?: number;
  monthlyInsurance?: number;
  mortgageBalance?: number;
  depositAmount?: number;
  rentStartDate?: string;
  oneOffFees?: Fee[];
  scheduledFees?: Fee[];
  status?: string;
  bmvScore?: number;
  [key: string]: unknown;
}

interface Fee {
  amount: number;
  frequency: string;
  [key: string]: unknown;
}

interface SimplePropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onSold: (id: string, address: string) => void;
  onRemove: (id: string, address: string) => void;
  onValuation?: (property: Property) => void;
}

export default function SimplePropertyCard({ property, onEdit, onSold, onRemove, onValuation }: SimplePropertyCardProps) {
  const [streetName, setStreetName] = useState<string | null>(null);
  const [isLoadingStreet, setIsLoadingStreet] = useState(false);
  const hasLookedUp = useRef(false);

  // Formatting functions now imported from centralized utilities

  // Extract house number and postcode
  const getAddressInfo = (address: string, postcode: string) => {
    if (!address) return { houseNumber: 'N/A', postcode: postcode || 'N/A' };
    
    const addressParts = address.split(' ');
    const houseNumber = addressParts[0];
    
    let finalPostcode = postcode;
    if (!finalPostcode) {
      const lastPart = addressParts[addressParts.length - 1];
      const postcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}$/i;
      if (postcodePattern.test(lastPart)) {
        finalPostcode = lastPart;
      }
    }
    
    return { houseNumber, postcode: finalPostcode || 'N/A' };
  };

  // Lookup street name from postcode
  useEffect(() => {
    const { postcode } = getAddressInfo(property.address, property.postcode);
    
    if (postcode && postcode !== 'N/A' && !streetName && !isLoadingStreet && !hasLookedUp.current) {
      hasLookedUp.current = true;
      setIsLoadingStreet(true);
      
      fetch(`/api/postcode-lookup?postcode=${encodeURIComponent(postcode)}`)
        .then(response => response.json())
        .then(data => {
          if (data.street) {
            setStreetName(data.street);
          } else {
            // Use a more descriptive fallback instead of just "Street"
            setStreetName('Unknown Street Name');
          }
        })
        .catch(error => {
          console.error('Failed to lookup street name:', error);
          setStreetName('Unknown Street Name');
        })
        .finally(() => {
          setIsLoadingStreet(false);
        });
    }
  }, [property.address, property.postcode]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateGrowth = (current: number, purchase: number) => {
    if (!current || !purchase) return 0;
    return ((current - purchase) / purchase) * 100;
  };

  const calculateEquity = (currentValue: number, mortgageBalance: number, depositAmount: number, purchasePrice: number) => {
    if (!currentValue) return 0;
    
    // If there's a mortgage balance, calculate equity as: current value - mortgage balance
    if (mortgageBalance && mortgageBalance > 0) {
      return currentValue - mortgageBalance;
    }
    
    // If no mortgage (cash purchase or deposit only), equity is: deposit + appreciation
    const deposit = depositAmount || 0;
    const appreciation = currentValue - purchasePrice;
    return deposit + appreciation;
  };

  const calculateOwnershipPercentage = (equity: number, currentValue: number) => {
    if (!currentValue || currentValue === 0) return 0;
    return (equity / currentValue) * 100;
  };

  const calculateValueGrowth = (currentValue: number, purchasePrice: number) => {
    if (!currentValue || !purchasePrice) return 0;
    return currentValue - purchasePrice;
  };

  const calculateTotalGainsLosses = (valueGrowth: number, monthlyProfit: number, monthsOwned: number) => {
    if (!valueGrowth && !monthlyProfit) return 0;
    
    // Calculate total rental profit (monthly profit * months owned)
    const totalRentalProfit = (monthlyProfit || 0) * (monthsOwned || 0);
    
    // Total gains/losses = value growth + total rental profit
    return valueGrowth + totalRentalProfit;
  };

  const calculateYield = (monthlyRent: number, currentValue: number) => {
    if (!monthlyRent || !currentValue) return 0;
    
    // Annual rent = monthly rent * 12
    const annualRent = monthlyRent * 12;
    
    // Yield = (annual rent / current value) * 100
    return (annualRent / currentValue) * 100;
  };

  const calculateROI = (totalGainsLosses: number, totalInvested: number) => {
    if (!totalGainsLosses || !totalInvested) return 0;
    
    // ROI = (Total Gains/Losses / Total Invested) * 100
    return (totalGainsLosses / totalInvested) * 100;
  };

  const calculateTotalInvested = (depositAmount: number, oneOffFees: Fee[], scheduledFees: Fee[]) => {
    let total = depositAmount || 0;
    
    // Add one-off fees
    if (oneOffFees && Array.isArray(oneOffFees)) {
      total += oneOffFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    }
    
    // Add scheduled fees (only one-time fees, not recurring)
    if (scheduledFees && Array.isArray(scheduledFees)) {
      total += scheduledFees
        .filter(fee => fee.frequency === 'one_time')
        .reduce((sum, fee) => sum + (fee.amount || 0), 0);
    }
    
    return total;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'watching': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (!score || score === 0) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-emerald-100 text-emerald-800';
    if (score >= 65) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-blue-100 text-blue-800';
    if (score >= 35) return 'bg-yellow-100 text-yellow-800';
    if (score >= 20) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const growth = calculateGrowth(property.currentValue, property.purchasePrice);
  // Debug logging for monthly profit calculation
  console.log('Property data for monthly profit:', {
    address: property.address,
    monthlyRent: property.monthlyRent,
    monthlyMortgagePayment: property.monthlyMortgagePayment,
    monthlyExpenses: property.monthlyExpenses,
    monthlyAgentFee: property.monthlyAgentFee,
    monthlyInsurance: property.monthlyInsurance
  });

  const monthlyProfit = property.monthlyRent 
    ? property.monthlyRent - (property.monthlyMortgagePayment || 0) - (property.monthlyExpenses || 0) - (property.monthlyAgentFee || 0) - (property.monthlyInsurance || 0)
    : null;

  
  const equity = calculateEquity(property.currentValue, property.mortgageBalance, property.depositAmount, property.purchasePrice);
  const ownershipPercentage = calculateOwnershipPercentage(equity, property.currentValue);
  const valueGrowth = calculateValueGrowth(property.currentValue, property.purchasePrice);
  
  // Calculate months owned
  const purchaseDate = property.purchaseDate ? new Date(property.purchaseDate) : null;
  let monthsOwned = 0;
  
  if (purchaseDate) {
    const timeDiff = Date.now() - purchaseDate.getTime();
    // If purchase date is in the future (test data), use a reasonable estimate
    if (timeDiff < 0) {
      // For test properties, assume they were purchased 6 months ago
      monthsOwned = 6;
    } else {
      monthsOwned = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30.44)));
    }
  }

  console.log('Months owned calculation:', {
    address: property.address,
    purchaseDate: property.purchaseDate,
    parsedPurchaseDate: purchaseDate,
    timeDiff: purchaseDate ? Date.now() - purchaseDate.getTime() : 'no date',
    monthsOwned: monthsOwned
  });
  
  // Calculate months rented
  const rentStartDate = property.rentStartDate ? new Date(property.rentStartDate) : null;
  let monthsRented = 0;
  
  if (rentStartDate) {
    const timeDiff = Date.now() - rentStartDate.getTime();
    // If rent start date is in the future (test data), use a reasonable estimate
    if (timeDiff < 0) {
      // For test properties, assume they've been rented for 3 months
      monthsRented = 3;
    } else {
      monthsRented = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30.44)));
    }
  }

  console.log('Months rented calculation:', {
    address: property.address,
    rentStartDate: property.rentStartDate,
    parsedRentStartDate: rentStartDate,
    timeDiff: rentStartDate ? Date.now() - rentStartDate.getTime() : 'no date',
    monthsRented: monthsRented
  });
  
  // Calculate total gains/losses using rental duration for rental income
  const totalGainsLosses = calculateTotalGainsLosses(valueGrowth, monthlyProfit || 0, monthsRented);
  
  // Calculate yield
  const annualYield = calculateYield(property.monthlyRent || 0, property.currentValue || 0);
  
  // Calculate total invested
  const totalInvested = calculateTotalInvested(property.depositAmount || 0, property.oneOffFees || [], property.scheduledFees || []);
  
  // Calculate ROI
  const roi = calculateROI(totalGainsLosses, totalInvested);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            {(() => {
              const { houseNumber, postcode } = getAddressInfo(property.address, property.postcode);
              const displayAddress = streetName 
                ? `${houseNumber} ${streetName}`
                : isLoadingStreet 
                  ? `${houseNumber} Loading...`
                  : `${houseNumber} [Street Name]`;
              
              return (
                <>
                  <h3 className="text-lg font-semibold text-gray-900">{displayAddress}</h3>
                  <p className="text-sm text-gray-600">{postcode}</p>
                </>
              );
            })()}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
          {property.status}
        </span>
      </div>

               {/* Key Metrics */}
         <div className="grid grid-cols-3 gap-3 mb-6">
           <div className="text-center">
             <div className="text-xl font-bold text-gray-900">{formatPrice(property.currentValue)}</div>
             <div className="text-xs text-gray-600">Current Value</div>
           </div>
           <div className="text-center">
             <div className={`text-xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
               {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
             </div>
             <div className="text-xs text-gray-600">Growth %</div>
           </div>
           <div className="text-center">
             <div className="text-xl font-bold text-blue-600">{formatPrice(equity)}</div>
             <div className="text-xs text-gray-600">Equity</div>
           </div>
         </div>

         {/* Total Gains/Losses - Detailed Breakdown */}
         <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6 border border-gray-200">
           <div className="text-center mb-3">
             <div className="text-sm text-gray-600 font-medium">Total Gains/Losses</div>
             <div className="text-xs text-gray-500">
               {monthsRented > 0 ? `Rented for ${monthsRented} months` : 'Not yet rented'}
             </div>
           </div>
           
           {/* Value Growth */}
           <div className="flex justify-between items-center mb-2">
             <span className="text-sm text-gray-600">Value Growth</span>
             <span className={`text-sm font-medium ${valueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
               {valueGrowth >= 0 ? '+' : ''}{formatPrice(valueGrowth)}
             </span>
           </div>
           
           {/* Rental Income */}
           <div className="flex justify-between items-center mb-3">
             <span className="text-sm text-gray-600">Rental Income</span>
             <span className={`text-sm font-medium ${(monthlyProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
               {monthlyProfit ? (monthsRented > 0 ? formatPrice((monthlyProfit || 0) * monthsRented) : '£0') : 'N/A'}
             </span>
           </div>
           
           {/* Total - Prominent Display */}
           <div className="border-t border-gray-200 pt-3">
             <div className="flex justify-between items-center">
               <span className="text-sm font-semibold text-gray-700">Total</span>
               <span className={`text-lg font-bold ${totalGainsLosses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                 {totalGainsLosses >= 0 ? '+' : ''}{formatPrice(totalGainsLosses)}
               </span>
             </div>
           </div>
         </div>

         {/* Yield - Prominent Display */}
         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
           <div className="text-center">
             <div className="text-2xl font-bold text-blue-600">
               {annualYield.toFixed(2)}%
             </div>
             <div className="text-sm text-gray-600 font-medium">Annual Yield</div>
             <div className="text-xs text-gray-500 mt-1">
               {property.monthlyRent ? `${formatPrice(property.monthlyRent)}/month rent` : 'No rent data'}
             </div>
           </div>
         </div>

         {/* ROI - Prominent Display */}
         <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 mb-6 border border-emerald-200">
           <div className="text-center">
             <div className="text-2xl font-bold text-emerald-600">
               {roi.toFixed(2)}%
             </div>
             <div className="text-sm text-gray-600 font-medium">Total ROI</div>
             <div className="text-xs text-gray-500 mt-1">
               {totalInvested > 0 ? `On £${totalInvested.toLocaleString()} total invested` : 'No investment data'}
             </div>
           </div>
         </div>

      {/* Financial Summary */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Purchase Price</span>
          <span className="text-sm font-medium">{formatPrice(property.purchasePrice)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Invested</span>
          <span className="text-sm font-medium text-purple-600">{formatPrice(totalInvested)}</span>
        </div>
        
        {/* Equity and Ownership Section */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Equity</span>
            <span className="text-sm font-medium text-blue-600">{formatPrice(equity)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Ownership %</span>
            <span className="text-sm font-medium text-blue-600">{ownershipPercentage.toFixed(1)}%</span>
          </div>

        </div>
        
                   <div className="flex justify-between items-center">
             <span className="text-sm text-gray-600">Monthly Rent</span>
             <span className="text-sm font-medium">{property.monthlyRent ? formatPrice(property.monthlyRent) : 'N/A'}</span>
           </div>
           
           <div className="flex justify-between items-center">
             <span className="text-sm text-gray-600">Annual Yield</span>
             <span className="text-sm font-medium text-blue-600">{annualYield.toFixed(2)}%</span>
           </div>
           
           <div className="flex justify-between items-center">
             <span className="text-sm text-gray-600">Total ROI</span>
             <span className="text-sm font-medium text-emerald-600">{roi.toFixed(2)}%</span>
           </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Monthly Profit</span>
          <span className={`text-sm font-medium ${monthlyProfit && monthlyProfit > 0 ? 'text-green-600' : monthlyProfit && monthlyProfit < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {monthlyProfit !== null ? formatPrice(monthlyProfit) : 'N/A'}
          </span>
        </div>
        {monthlyProfit === null && property.monthlyRent && (
          <div className="text-xs text-gray-500 mt-1">
            Add mortgage payment in Edit to see profit
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Portfolio Score</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(property.bmvScore)}`}>
            {property.bmvScore ? `${property.bmvScore}/100` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Purchase Date */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Calendar className="w-4 h-4" />
        <span>Purchased {formatDate(property.purchaseDate)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {onValuation && (
          <button
            onClick={() => onValuation(property)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors min-w-[80px]"
          >
            <TrendingUp className="w-4 h-4" />
            Valuation
          </button>
        )}
        <button
          onClick={() => onEdit(property)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors min-w-[80px]"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onSold(property.id, property.address)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors min-w-[80px]"
        >
          <CheckCircle className="w-4 h-4" />
          Sold
        </button>
        <button
          onClick={() => onRemove(property.id, property.address)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors min-w-[80px]"
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </button>
      </div>
    </motion.div>
  );
} 