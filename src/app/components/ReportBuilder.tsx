'use client';

import { useState, useEffect } from 'react';
import { reportGenerator, PropertyReportData, PortfolioReportData, MarketReportData } from '@/lib/reportGenerator';
import { dataExportService } from '@/lib/dataExportService';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface ReportBuilderProps {
  userId: string;
  className?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  type: 'property' | 'portfolio' | 'market';
  description: string;
  fields: string[];
  config: any;
}

export default function ReportBuilder({ userId, className = "" }: ReportBuilderProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<Blob | null>(null);
  const [exportJobs, setExportJobs] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadExportJobs();
  }, [userId]);

  const loadTemplates = () => {
    // Load predefined templates
    const predefinedTemplates: ReportTemplate[] = [
      {
        id: 'property-analysis',
        name: 'Property Analysis Report',
        type: 'property',
        description: 'Comprehensive analysis of a single property including market data, investment metrics, and recommendations',
        fields: ['address', 'price', 'bmvScore', 'marketAnalysis', 'investmentAnalysis', 'financialProjections'],
        config: {
          title: 'Property Analysis Report',
          includeCharts: true,
          includeComparables: true,
          includeRecommendations: true
        }
      },
      {
        id: 'portfolio-performance',
        name: 'Portfolio Performance Report',
        type: 'portfolio',
        description: 'Detailed portfolio performance analysis with diversification metrics and recommendations',
        fields: ['portfolio', 'performance', 'diversification', 'recommendations'],
        config: {
          title: 'Portfolio Performance Report',
          includeCharts: true,
          includeProjections: true,
          includeRecommendations: true
        }
      },
      {
        id: 'market-intelligence',
        name: 'Market Intelligence Report',
        type: 'market',
        description: 'Market trend analysis and intelligence report for specific regions or property types',
        fields: ['market', 'trends', 'analysis', 'data'],
        config: {
          title: 'Market Intelligence Report',
          includeCharts: true,
          includeForecasts: true,
          includeRecommendations: true
        }
      }
    ];

    setTemplates(predefinedTemplates);
  };

  const loadExportJobs = () => {
    const jobs = dataExportService.getUserJobs(userId);
    setExportJobs(jobs);
  };

  const generateReport = async (template: ReportTemplate, data: any) => {
    setIsGenerating(true);
    try {
      let reportBlob: Blob;

      switch (template.type) {
        case 'property':
          reportBlob = await reportGenerator.generatePropertyReport(data as PropertyReportData, template.config);
          break;
        case 'portfolio':
          reportBlob = await reportGenerator.generatePortfolioReport(data as PortfolioReportData, template.config);
          break;
        case 'market':
          reportBlob = await reportGenerator.generateMarketReport(data as MarketReportData, template.config);
          break;
        default:
          throw new Error(`Unsupported report type: ${template.type}`);
      }

      setGeneratedReport(reportBlob);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = async (format: string) => {
    if (!generatedReport) return;

    setIsExporting(true);
    try {
      const exportData = {
        type: 'custom' as const,
        data: [/* report data would go here */],
        metadata: {
          exportDate: new Date(),
          recordCount: 1,
          source: 'Report Builder'
        }
      };

      const config = {
        format: format as any,
        filename: `${selectedTemplate?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`,
        includeHeaders: true,
        dateFormat: 'YYYY-MM-DD',
        numberFormat: 'en-GB',
        encoding: 'utf-8' as const
      };

      const jobId = await dataExportService.createExportJob(userId, exportData, config);
      loadExportJobs();
      
      alert(`Export job created successfully. Job ID: ${jobId}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadReport = () => {
    if (!generatedReport) return;

    const url = URL.createObjectURL(generatedReport);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <DocumentTextIcon className="w-6 h-6 text-blue-600" />;
      case 'portfolio':
        return <ChartBarIcon className="w-6 h-6 text-green-600" />;
      case 'market':
        return <TableCellsIcon className="w-6 h-6 text-purple-600" />;
      default:
        return <DocumentTextIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Builder</h2>
          <p className="text-gray-600">Create and customize professional property reports</p>
        </div>
        <button
          onClick={() => setSelectedTemplate(null)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Report</span>
        </button>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="flex items-center space-x-3 mb-4">
              {getTemplateIcon(template.type)}
              <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 capitalize">{template.type} Report</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Generate sample report
                  generateReport(template, getSampleData(template.type));
                }}
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm hover:bg-blue-200 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Actions */}
      {selectedTemplate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getTemplateIcon(selectedTemplate.type)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <p className="text-gray-600 text-sm">{selectedTemplate.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => generateReport(selectedTemplate, getSampleData(selectedTemplate.type))}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
              </button>
              
              {generatedReport && (
                <button
                  onClick={downloadReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>

          {/* Export Options */}
          {generatedReport && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Export Options</h4>
              <div className="flex items-center space-x-2">
                {['csv', 'xlsx', 'json', 'pdf'].map((format) => (
                  <button
                    key={format}
                    onClick={() => exportReport(format)}
                    disabled={isExporting}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Jobs */}
      {exportJobs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Jobs</h3>
          <div className="space-y-3">
            {exportJobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  <span className="text-sm text-gray-600">{job.config.filename}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {job.status === 'completed' && job.downloadUrl && (
                    <a
                      href={job.downloadUrl}
                      download
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Download
                    </a>
                  )}
                  {job.status === 'processing' && (
                    <span className="text-sm text-gray-500">{job.progress}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {showPreview && generatedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Report Preview</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadReport}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 h-96 overflow-auto">
              <iframe
                src={URL.createObjectURL(generatedReport)}
                className="w-full h-full border-0"
                title="Report Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get sample data for different report types
function getSampleData(type: string): any {
  switch (type) {
    case 'property':
      return {
        property: {
          address: '123 Sample Street',
          postcode: 'SW1A 1AA',
          price: 450000,
          estimatedValue: 500000,
          bmvScore: 85,
          propertyType: 'Terraced',
          bedrooms: 3,
          bathrooms: 2,
          floorArea: 120,
          dateOfTransfer: '2024-01-15'
        },
        marketAnalysis: {
          localAveragePrice: 475000,
          pricePerSqm: 3750,
          marketTrend: 'rising' as const,
          trendPercentage: 5.2,
          comparableProperties: []
        },
        investmentAnalysis: {
          rentalYield: 4.5,
          capitalGrowth: 6.8,
          totalReturn: 11.3,
          riskScore: 6,
          investmentGrade: 'B' as const,
          recommendations: [
            'Strong BMV opportunity with good rental yield potential',
            'Consider property improvements to increase value',
            'Monitor local market trends for optimal exit timing'
          ]
        },
        financialProjections: {
          year1: { value: 480000, growth: 6.7 },
          year3: { value: 520000, growth: 15.6 },
          year5: { value: 580000, growth: 28.9 },
          year10: { value: 750000, growth: 66.7 }
        }
      };
    
    case 'portfolio':
      return {
        portfolio: {
          totalValue: 2500000,
          totalInvestment: 2000000,
          totalReturn: 500000,
          returnPercentage: 25,
          properties: []
        },
        performance: {
          monthlyReturns: [2.1, 1.8, 2.3, 1.9, 2.5],
          annualReturns: [12.5, 15.2, 18.7, 22.1, 25.0],
          volatility: 8.5,
          sharpeRatio: 1.8,
          maxDrawdown: 5.2
        },
        diversification: {
          byLocation: { 'London': 40, 'Manchester': 25, 'Birmingham': 20, 'Leeds': 15 },
          byPropertyType: { 'Terraced': 35, 'Semi-detached': 30, 'Detached': 20, 'Flat': 15 },
          byInvestmentGrade: { 'A': 25, 'B': 45, 'C': 25, 'D': 5 }
        },
        recommendations: {
          rebalancing: ['Consider reducing London exposure', 'Increase Manchester allocation'],
          newInvestments: ['Look for BMV opportunities in Birmingham', 'Consider commercial properties'],
          riskManagement: ['Diversify across more regions', 'Consider property insurance']
        }
      };
    
    case 'market':
      return {
        market: {
          region: 'Greater London',
          period: 'Q1 2024',
          totalTransactions: 15420,
          averagePrice: 525000,
          priceChange: 3.2,
          volumeChange: -5.8
        },
        trends: {
          priceTrend: 'rising' as const,
          volumeTrend: 'falling' as const,
          bmvOpportunities: 1250,
          marketActivity: 'medium' as const
        },
        analysis: {
          keyDrivers: ['Interest rate stability', 'Supply constraints', 'Foreign investment'],
          risks: ['Economic uncertainty', 'Regulatory changes', 'Market saturation'],
          opportunities: ['BMV properties in outer boroughs', 'New development areas', 'Commercial conversions'],
          outlook: 'The London property market shows resilience with moderate price growth despite reduced transaction volumes. BMV opportunities remain strong in emerging areas.'
        },
        data: {
          priceHistory: [],
          volumeHistory: [],
          topAreas: [
            { area: 'Tower Hamlets', growth: 8.5, volume: 450 },
            { area: 'Hackney', growth: 7.2, volume: 380 },
            { area: 'Lambeth', growth: 6.8, volume: 420 }
          ]
        }
      };
    
    default:
      return {};
  }
}
