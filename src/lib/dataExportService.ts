// Comprehensive data export service for property data, reports, and analytics

interface ExportConfig {
  format: 'csv' | 'xlsx' | 'json' | 'xml' | 'pdf';
  filename: string;
  includeHeaders: boolean;
  dateFormat: string;
  numberFormat: string;
  encoding: 'utf-8' | 'utf-16';
  compression?: boolean;
}

interface ExportData {
  type: 'properties' | 'portfolio' | 'market_data' | 'transactions' | 'analytics' | 'custom';
  data: any[];
  metadata?: {
    exportDate: Date;
    recordCount: number;
    filters?: Record<string, any>;
    source: string;
  };
}

interface ExportJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  config: ExportConfig;
  data: ExportData;
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  downloadUrl?: string;
  expiresAt?: Date;
}

class DataExportService {
  private jobs: Map<string, ExportJob> = new Map();
  private maxConcurrentJobs = 3;
  private activeJobs = 0;

  constructor() {
    this.startJobProcessor();
  }

  // Create export job
  async createExportJob(
    userId: string,
    data: ExportData,
    config: ExportConfig
  ): Promise<string> {
    const jobId = this.generateJobId();
    
    const job: ExportJob = {
      id: jobId,
      userId,
      status: 'pending',
      config,
      data,
      progress: 0,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    
    // Process job asynchronously
    this.processJob(jobId);
    
    return jobId;
  }

  // Get export job status
  getJobStatus(jobId: string): ExportJob | null {
    return this.jobs.get(jobId) || null;
  }

  // Get user's export jobs
  getUserJobs(userId: string): ExportJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Cancel export job
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'failed';
    job.error = 'Job cancelled by user';
    job.completedAt = new Date();
    
    return true;
  }

  // Process export job
  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    if (this.activeJobs >= this.maxConcurrentJobs) {
      // Queue job for later processing
      setTimeout(() => this.processJob(jobId), 1000);
      return;
    }

    this.activeJobs++;
    job.status = 'processing';

    try {
      let result: Blob | string;
      
      switch (job.config.format) {
        case 'csv':
          result = await this.exportToCSV(job.data, job.config);
          break;
        case 'xlsx':
          result = await this.exportToXLSX(job.data, job.config);
          break;
        case 'json':
          result = await this.exportToJSON(job.data, job.config);
          break;
        case 'xml':
          result = await this.exportToXML(job.data, job.config);
          break;
        case 'pdf':
          result = await this.exportToPDF(job.data, job.config);
          break;
        default:
          throw new Error(`Unsupported export format: ${job.config.format}`);
      }

      // Generate download URL
      const downloadUrl = await this.generateDownloadUrl(result, job.config);
      
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();
      job.downloadUrl = downloadUrl;
      job.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    } finally {
      this.activeJobs--;
    }
  }

  // Export to CSV
  private async exportToCSV(data: ExportData, config: ExportConfig): Promise<Blob> {
    const { data: records, metadata } = data;
    
    if (!records || records.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first record
    const headers = Object.keys(records[0]);
    
    // Create CSV content
    let csvContent = '';
    
    if (config.includeHeaders) {
      csvContent += headers.join(',') + '\n';
    }

    // Add data rows
    records.forEach(record => {
      const row = headers.map(header => {
        const value = record[header];
        if (value === null || value === undefined) {
          return '';
        }
        
        // Handle different data types
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        if (value instanceof Date) {
          return value.toISOString();
        }
        
        return String(value);
      });
      
      csvContent += row.join(',') + '\n';
    });

    // Add metadata if available
    if (metadata) {
      csvContent += '\n# Metadata\n';
      csvContent += `# Export Date: ${metadata.exportDate.toISOString()}\n`;
      csvContent += `# Record Count: ${metadata.recordCount}\n`;
      csvContent += `# Source: ${metadata.source}\n`;
      
      if (metadata.filters) {
        csvContent += `# Filters: ${JSON.stringify(metadata.filters)}\n`;
      }
    }

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  // Export to XLSX
  private async exportToXLSX(data: ExportData, config: ExportConfig): Promise<Blob> {
    // This would require a library like xlsx or exceljs
    // For now, we'll create a simple CSV that can be opened in Excel
    const csvBlob = await this.exportToCSV(data, config);
    
    // Convert CSV to XLSX-like format
    const csvContent = await csvBlob.text();
    const xlsxContent = this.convertCSVToXLSX(csvContent);
    
    return new Blob([xlsxContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Export to JSON
  private async exportToJSON(data: ExportData, config: ExportConfig): Promise<Blob> {
    const exportData = {
      metadata: data.metadata,
      data: data.data,
      exportInfo: {
        format: 'json',
        exportedAt: new Date().toISOString(),
        recordCount: data.data.length
      }
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    return new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  }

  // Export to XML
  private async exportToXML(data: ExportData, config: ExportConfig): Promise<Blob> {
    const { data: records, metadata } = data;
    
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<export>\n';
    
    // Add metadata
    if (metadata) {
      xmlContent += '  <metadata>\n';
      xmlContent += `    <exportDate>${metadata.exportDate.toISOString()}</exportDate>\n`;
      xmlContent += `    <recordCount>${metadata.recordCount}</recordCount>\n`;
      xmlContent += `    <source>${metadata.source}</source>\n`;
      if (metadata.filters) {
        xmlContent += `    <filters>${JSON.stringify(metadata.filters)}</filters>\n`;
      }
      xmlContent += '  </metadata>\n';
    }
    
    // Add data
    xmlContent += '  <data>\n';
    records.forEach((record, index) => {
      xmlContent += `    <record id="${index}">\n`;
      Object.entries(record).forEach(([key, value]) => {
        const xmlKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        const xmlValue = this.escapeXml(String(value || ''));
        xmlContent += `      <${xmlKey}>${xmlValue}</${xmlKey}>\n`;
      });
      xmlContent += '    </record>\n';
    });
    xmlContent += '  </data>\n';
    xmlContent += '</export>';

    return new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  }

  // Export to PDF
  private async exportToPDF(data: ExportData, config: ExportConfig): Promise<Blob> {
    // This would integrate with the report generator
    // For now, we'll create a simple text-based PDF
    const { data: records, metadata } = data;
    
    let pdfContent = `Property Data Export\n`;
    pdfContent += `Generated: ${new Date().toLocaleDateString()}\n`;
    pdfContent += `Records: ${records.length}\n\n`;
    
    if (metadata) {
      pdfContent += `Source: ${metadata.source}\n`;
      pdfContent += `Export Date: ${metadata.exportDate.toLocaleDateString()}\n\n`;
    }
    
    // Add data table
    if (records.length > 0) {
      const headers = Object.keys(records[0]);
      pdfContent += headers.join('\t') + '\n';
      
      records.slice(0, 100).forEach(record => { // Limit to 100 records for PDF
        const row = headers.map(header => String(record[header] || ''));
        pdfContent += row.join('\t') + '\n';
      });
      
      if (records.length > 100) {
        pdfContent += `\n... and ${records.length - 100} more records\n`;
      }
    }

    // Convert to PDF blob (simplified)
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  // Generate download URL
  private async generateDownloadUrl(content: Blob | string, config: ExportConfig): Promise<string> {
    // In a real implementation, this would upload to a cloud storage service
    // For now, we'll create a data URL
    if (typeof content === 'string') {
      return `data:application/octet-stream;base64,${btoa(content)}`;
    }
    
    return URL.createObjectURL(content);
  }

  // Convert CSV to XLSX-like format
  private convertCSVToXLSX(csvContent: string): string {
    // This is a simplified conversion
    // In a real implementation, you would use a proper XLSX library
    return csvContent;
  }

  // Escape XML special characters
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Start job processor
  private startJobProcessor() {
    // Clean up expired jobs every hour
    setInterval(() => {
      this.cleanupExpiredJobs();
    }, 60 * 60 * 1000);
  }

  // Clean up expired jobs
  private cleanupExpiredJobs() {
    const now = new Date();
    
    this.jobs.forEach((job, jobId) => {
      if (job.expiresAt && job.expiresAt < now) {
        this.jobs.delete(jobId);
      }
    });
  }

  // Generate unique job ID
  private generateJobId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get export statistics
  getExportStats(): { totalJobs: number; activeJobs: number; completedJobs: number; failedJobs: number } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.status === 'processing').length,
      completedJobs: jobs.filter(job => job.status === 'completed').length,
      failedJobs: jobs.filter(job => job.status === 'failed').length
    };
  }

  // Export property data
  async exportProperties(
    userId: string,
    properties: any[],
    config: Partial<ExportConfig> = {}
  ): Promise<string> {
    const exportConfig: ExportConfig = {
      format: 'csv',
      filename: `properties_${new Date().toISOString().split('T')[0]}.csv`,
      includeHeaders: true,
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'en-GB',
      encoding: 'utf-8',
      ...config
    };

    const exportData: ExportData = {
      type: 'properties',
      data: properties,
      metadata: {
        exportDate: new Date(),
        recordCount: properties.length,
        source: 'Property Intelligence Platform'
      }
    };

    return this.createExportJob(userId, exportData, exportConfig);
  }

  // Export portfolio data
  async exportPortfolio(
    userId: string,
    portfolio: any,
    config: Partial<ExportConfig> = {}
  ): Promise<string> {
    const exportConfig: ExportConfig = {
      format: 'xlsx',
      filename: `portfolio_${new Date().toISOString().split('T')[0]}.xlsx`,
      includeHeaders: true,
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'en-GB',
      encoding: 'utf-8',
      ...config
    };

    const exportData: ExportData = {
      type: 'portfolio',
      data: portfolio.properties || [],
      metadata: {
        exportDate: new Date(),
        recordCount: portfolio.properties?.length || 0,
        source: 'Property Intelligence Platform',
        filters: { portfolioId: portfolio.id }
      }
    };

    return this.createExportJob(userId, exportData, exportConfig);
  }

  // Export market data
  async exportMarketData(
    userId: string,
    marketData: any[],
    config: Partial<ExportConfig> = {}
  ): Promise<string> {
    const exportConfig: ExportConfig = {
      format: 'json',
      filename: `market_data_${new Date().toISOString().split('T')[0]}.json`,
      includeHeaders: true,
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'en-GB',
      encoding: 'utf-8',
      ...config
    };

    const exportData: ExportData = {
      type: 'market_data',
      data: marketData,
      metadata: {
        exportDate: new Date(),
        recordCount: marketData.length,
        source: 'Property Intelligence Platform'
      }
    };

    return this.createExportJob(userId, exportData, exportConfig);
  }

  // Export custom data
  async exportCustomData(
    userId: string,
    data: any[],
    type: string,
    config: Partial<ExportConfig> = {}
  ): Promise<string> {
    const exportConfig: ExportConfig = {
      format: 'csv',
      filename: `${type}_${new Date().toISOString().split('T')[0]}.csv`,
      includeHeaders: true,
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'en-GB',
      encoding: 'utf-8',
      ...config
    };

    const exportData: ExportData = {
      type: 'custom',
      data: data,
      metadata: {
        exportDate: new Date(),
        recordCount: data.length,
        source: 'Property Intelligence Platform',
        filters: { customType: type }
      }
    };

    return this.createExportJob(userId, exportData, exportConfig);
  }
}

// Singleton instance
export const dataExportService = new DataExportService();

// Export types
export type { ExportConfig, ExportData, ExportJob };
