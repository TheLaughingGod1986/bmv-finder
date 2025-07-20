import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201'
});

export async function GET(request: NextRequest) {
  try {
    const analysis = {
      timestamp: new Date().toISOString(),
      currentDataSources: {
        elasticsearch: {
          status: 'active',
          indices: [],
          totalDocuments: 0,
          issues: []
        },
        epcApi: {
          status: 'broken',
          issues: ['401 Unauthorized - Missing API key'],
          recommendations: []
        },
        propertyEnrichment: {
          status: 'partial',
          workingFeatures: ['Enhanced property data', 'Caching'],
          issues: ['EPC API integration broken']
        },
        houseMetric: {
          status: 'manual',
          coverage: 'Single property (21 Fourstones)',
          recommendations: []
        }
      },
      improvementOpportunities: [],
      recommendations: []
    };

    // Analyze Elasticsearch indices
    try {
      const indicesResponse = await esClient.cat.indices({ format: 'json' });
      analysis.currentDataSources.elasticsearch.indices = indicesResponse.map((index: any) => ({
        name: index.index,
        documents: parseInt(index['docs.count']),
        size: index['store.size'],
        health: index.health
      }));
      
      analysis.currentDataSources.elasticsearch.totalDocuments = 
        indicesResponse.reduce((sum: number, index: any) => sum + parseInt(index['docs.count']), 0);
    } catch (error) {
      analysis.currentDataSources.elasticsearch.status = 'error';
      analysis.currentDataSources.elasticsearch.issues.push(`Elasticsearch connection failed: ${error}`);
    }

    // EPC API Analysis
    analysis.currentDataSources.epcApi.recommendations = [
      'Register for EPC Open Data Communities API key',
      'Implement proper authentication headers',
      'Add fallback to cached EPC data',
      'Consider alternative EPC data sources'
    ];

    // Property Enrichment Analysis
    analysis.currentDataSources.propertyEnrichment.issues = [
      'EPC API integration broken (401 error)',
      'Limited to enhanced property data only',
      'No real-time EPC updates'
    ];

    // HouseMetric Analysis
    analysis.currentDataSources.houseMetric.recommendations = [
      'Explore HouseMetric API access',
      'Implement web scraping for key properties',
      'Build comprehensive property database',
      'Integrate with multiple data sources'
    ];

    // Improvement Opportunities
    analysis.improvementOpportunities = [
      {
        priority: 'high',
        category: 'EPC Data',
        description: 'Fix EPC API integration for accurate energy ratings',
        impact: 'High - affects property valuations and rental potential',
        effort: 'Medium - requires API key and authentication setup'
      },
      {
        priority: 'low',
        category: 'Missing Indices',
        description: 'Missing indices fixed - APIs now use existing indices',
        impact: 'Low - all functionality working with existing data',
        effort: 'Done - fixed with correct index names'
      },
      {
        priority: 'medium',
        category: 'HouseMetric Integration',
        description: 'Automate HouseMetric-style data collection',
        impact: 'Medium - improves valuation accuracy',
        effort: 'High - requires API access or web scraping'
      },
      {
        priority: 'medium',
        category: 'Rate Limiting',
        description: 'Fix rate limiter response handling',
        impact: 'Medium - affects API reliability',
        effort: 'Low - fix response object handling'
      },
      {
        priority: 'low',
        category: 'Data Enrichment',
        description: 'Add planning data, transport links, school ratings',
        impact: 'Medium - improves location-based valuations',
        effort: 'High - requires multiple API integrations'
      }
    ];

    // Recommendations
    analysis.recommendations = [
      {
        immediate: [
          'Fix EPC API authentication (get API key from EPC Open Data Communities)',
          'Missing indices already fixed - using existing indices',
          'Rate limiter response handling already fixed'
        ],
        shortTerm: [
          'Implement HouseMetric-style data collection for key properties',
          'Add comprehensive error handling and fallbacks',
          'Build data quality monitoring dashboard'
        ],
        longTerm: [
          'Integrate with multiple property data APIs',
          'Implement machine learning for data validation',
          'Build comprehensive property database with real-time updates'
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Data sources analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze data sources'
    }, { status: 500 });
  }
} 