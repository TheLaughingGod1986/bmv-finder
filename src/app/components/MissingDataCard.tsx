'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './SimpleCard';
import { Input } from './SimpleInput';
import Button from './Button';
import { AlertTriangle, Plus, CheckCircle, Info, TrendingUp, Target } from 'lucide-react';

interface MissingDataField {
  name: string;
  displayName: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedImprovement: number;
  currentValue?: any;
  suggestedValue?: string;
}

interface MissingDataProps {
  missingData: {
    fields: MissingDataField[];
    totalPotentialImprovement: number;
    message: string;
  };
  onDataUpdate?: (fieldName: string, value: any) => void;
}

export default function MissingDataCard({ missingData, onDataUpdate }: MissingDataProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [inputValues, setInputValues] = useState<Record<string, any>>({});

  const toggleField = (fieldName: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldName)) {
      newExpanded.delete(fieldName);
    } else {
      newExpanded.add(fieldName);
    }
    setExpandedFields(newExpanded);
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setInputValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (fieldName: string) => {
    if (inputValues[fieldName] && onDataUpdate) {
      onDataUpdate(fieldName, inputValues[fieldName]);
      // Clear the input after submission
      setInputValues(prev => ({ ...prev, [fieldName]: '' }));
      setExpandedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      case 'low': return <Info className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  if (missingData.fields.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Complete Data Available</span>
          </div>
          <p className="text-green-600 mt-2 text-sm">
            All key property information is available. This valuation has high confidence.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <TrendingUp className="w-5 h-5" />
          <span>Improve Valuation Accuracy</span>
        </CardTitle>
        <div className="flex items-center space-x-2 text-orange-700">
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">
            Potential improvement: +{missingData.totalPotentialImprovement}% confidence
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-orange-700 mb-4 text-sm">
          {missingData.message}
        </p>

        <div className="space-y-3">
          {missingData.fields.map((field) => (
            <div key={field.name} className="border border-orange-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getImpactIcon(field.impact)}
                  <span className="font-medium text-gray-900">{field.displayName}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(field.impact)}`}>
                    {field.impact.toUpperCase()} IMPACT
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    +{field.estimatedImprovement}% accuracy
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleField(field.name)}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    {expandedFields.has(field.name) ? 'Cancel' : 'Add Data'}
                  </Button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mt-2">
                {field.description}
              </p>

              {field.suggestedValue && (
                <p className="text-gray-500 text-sm mt-1">
                  <span className="font-medium">Suggested:</span> {field.suggestedValue}
                </p>
              )}

              {expandedFields.has(field.name) && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder={`Enter ${field.displayName.toLowerCase()}`}
                      value={inputValues[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSubmit(field.name)}
                      disabled={!inputValues[field.name]}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Why this matters:</p>
              <p className="mt-1">
                More accurate property data leads to better comparable sales matching, 
                more precise rental estimates, and improved construction cost calculations. 
                This results in higher confidence valuations and better investment decisions.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 