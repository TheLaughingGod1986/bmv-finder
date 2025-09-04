import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'financial' | 'market' | 'custom';
  type: 'dashboard' | 'summary' | 'detailed' | 'comparative' | 'trend';
  sections: ReportSection[];
  styling: ReportStyling;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'header' | 'summary' | 'chart' | 'table' | 'metric' | 'text' | 'image';
  content: SectionContent;
  layout: SectionLayout;
  conditional: ConditionalLogic;
  order: number;
}

export interface SectionContent {
  dataSource?: string;
  query?: string;
  text?: string;
  chartConfig?: ChartConfig;
  tableConfig?: TableConfig;
  metricConfig?: MetricConfig;
  imageConfig?: ImageConfig;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'doughnut' | 'radar' | 'polar';
  title: string;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  data: ChartData;
  options: ChartOptions;
  colors: string[];
  responsive: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: LegendOptions;
    tooltip: TooltipOptions;
    title: TitleOptions;
  };
  scales?: {
    x?: ScaleOptions;
    y?: ScaleOptions;
  };
}

export interface LegendOptions {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
}

export interface TooltipOptions {
  enabled: boolean;
  mode: 'index' | 'point' | 'nearest' | 'single' | 'label' | 'x-axis' | 'dataset';
  intersect: boolean;
  backgroundColor: string;
  titleColor: string;
  bodyColor: string;
  borderColor: string;
  borderWidth: number;
}

export interface TitleOptions {
  display: boolean;
  text: string;
  font: FontConfig;
  color: string;
  padding: number;
}

export interface ScaleOptions {
  display: boolean;
  title: {
    display: boolean;
    text: string;
  };
  min?: number;
  max?: number;
  ticks: {
    beginAtZero: boolean;
    stepSize?: number;
    callback?: (value: any) => string;
  };
}

export interface FontConfig {
  family: string;
  size: number;
  weight: 'normal' | 'bold';
  style: 'normal' | 'italic';
}

export interface AxisConfig {
  title: string;
  type: 'linear' | 'logarithmic' | 'category' | 'time';
  min?: number;
  max?: number;
  format?: string;
}

export interface TableConfig {
  title: string;
  headers: TableHeader[];
  data: TableRow[];
  styling: TableStyling;
  pagination: PaginationConfig;
  sorting: SortingConfig;
  filtering: FilteringConfig;
}

export interface TableHeader {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
  sortable: boolean;
  filterable: boolean;
  width?: number;
  align: 'left' | 'center' | 'right';
}

export interface TableRow {
  id: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TableStyling {
  striped: boolean;
  bordered: boolean;
  hover: boolean;
  condensed: boolean;
  headerStyle: CellStyle;
  cellStyle: CellStyle;
  alternateRowStyle?: CellStyle;
}

export interface CellStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  fontSize?: number;
  padding?: number;
  border?: string;
}

export interface PaginationConfig {
  enabled: boolean;
  pageSize: number;
  showInfo: boolean;
  showNavigation: boolean;
}

export interface SortingConfig {
  enabled: boolean;
  defaultSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  multiSort: boolean;
}

export interface FilteringConfig {
  enabled: boolean;
  globalFilter: boolean;
  columnFilters: boolean;
  filterPlaceholder: string;
}

export interface MetricConfig {
  title: string;
  value: number;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  change?: MetricChange;
  comparison?: MetricComparison;
  styling: MetricStyling;
}

export interface MetricChange {
  value: number;
  type: 'increase' | 'decrease' | 'neutral';
  period: string;
  format: 'absolute' | 'percentage';
}

export interface MetricComparison {
  label: string;
  value: number;
  format: 'number' | 'currency' | 'percentage';
}

export interface MetricStyling {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
}

export interface ImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
  alignment: 'left' | 'center' | 'right';
}

export interface SectionLayout {
  width: number;
  height: number;
  margin: Spacing;
  padding: Spacing;
  backgroundColor?: string;
  border?: BorderConfig;
  shadow?: ShadowConfig;
}

export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BorderConfig {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  color: string;
  radius?: number;
}

export interface ShadowConfig {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  spread: number;
}

export interface ConditionalLogic {
  enabled: boolean;
  conditions: Condition[];
  operator: 'AND' | 'OR';
}

export interface Condition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists';
  value: any;
}

export interface ReportStyling {
  theme: 'light' | 'dark' | 'corporate' | 'modern' | 'minimal';
  colors: ColorPalette;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  layout: LayoutConfig;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: {
    base: number;
    small: number;
    large: number;
    xlarge: number;
  };
  fontWeight: {
    normal: 'normal' | 'bold';
    bold: 'normal' | 'bold';
  };
  lineHeight: number;
}

export interface SpacingConfig {
  unit: number;
  small: number;
  medium: number;
  large: number;
  xlarge: number;
}

export interface LayoutConfig {
  maxWidth: number;
  columns: number;
  gutter: number;
  margin: number;
}

export interface ReportInstance {
  id: string;
  templateId: string;
  name: string;
  description: string;
  data: ReportData;
  filters: ReportFilter[];
  parameters: Record<string, any>;
  status: 'draft' | 'generating' | 'ready' | 'error';
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  generatedAt?: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportData {
  sections: SectionData[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface SectionData {
  sectionId: string;
  title: string;
  type: string;
  content: any;
  rendered: boolean;
  error?: string;
}

export interface ReportSummary {
  totalSections: number;
  renderedSections: number;
  dataPoints: number;
  lastUpdated: Date;
  generationTime: number;
}

export interface ReportMetadata {
  template: string;
  version: string;
  generatedBy: string;
  dataSource: string;
  filters: string[];
  parameters: Record<string, any>;
}

export interface ReportFilter {
  id: string;
  name: string;
  type: 'select' | 'date' | 'text' | 'number' | 'boolean' | 'range';
  field: string;
  value: any;
  options?: any[];
  required: boolean;
  multiple: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  quality: 'draft' | 'standard' | 'high';
  includeCharts: boolean;
  includeData: boolean;
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: Spacing;
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
  watermark?: WatermarkConfig;
}

export interface HeaderFooterConfig {
  enabled: boolean;
  content: string;
  height: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize: number;
  alignment: 'left' | 'center' | 'right';
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  fontSize: number;
  color: string;
  angle: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export class ReportBuilder {
  private static instance: ReportBuilder;
  private templates: Map<string, ReportTemplate> = new Map();
  private instances: Map<string, ReportInstance> = new Map();
  private exports: Map<string, ExportJob> = new Map();

  private constructor() {
    this.initializeDefaultTemplates();
  }

  public static getInstance(): ReportBuilder {
    if (!ReportBuilder.instance) {
      ReportBuilder.instance = new ReportBuilder();
    }
    return ReportBuilder.instance;
  }

  // Template Management
  async createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    const reportTemplate: ReportTemplate = {
      id: crypto.randomUUID(),
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(reportTemplate.id, reportTemplate);

    try {
      await auditLogger.logUserAction('report_template_created', {
        templateId: reportTemplate.id,
        name: reportTemplate.name,
        category: reportTemplate.category
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return reportTemplate;
  }

  async updateTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    this.templates.set(templateId, updatedTemplate);

    try {
      await auditLogger.logUserAction('report_template_updated', {
        templateId,
        updates: Object.keys(updates)
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return updatedTemplate;
  }

  // Report Generation
  async generateReport(templateId: string, filters: ReportFilter[], parameters: Record<string, any>, requestedBy: string): Promise<ReportInstance> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Report template not found');
    }

    const reportInstance: ReportInstance = {
      id: crypto.randomUUID(),
      templateId,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description,
      data: {
        sections: [],
        summary: {
          totalSections: 0,
          renderedSections: 0,
          dataPoints: 0,
          lastUpdated: new Date(),
          generationTime: 0
        },
        metadata: {
          template: template.name,
          version: '1.0.0',
          generatedBy: requestedBy,
          dataSource: 'analytics_engine',
          filters: filters.map(f => f.name),
          parameters
        }
      },
      filters,
      parameters,
      status: 'generating',
      format: 'html',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.instances.set(reportInstance.id, reportInstance);

    try {
      await auditLogger.logUserAction('report_generation_started', {
        reportId: reportInstance.id,
        templateId,
        requestedBy
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    // Generate report data
    await this.generateReportData(reportInstance, template);

    return reportInstance;
  }

  // Export Management
  async exportReport(reportId: string, options: ExportOptions, requestedBy: string): Promise<ExportJob> {
    const report = this.instances.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const exportJob: ExportJob = {
      id: crypto.randomUUID(),
      reportId,
      format: options.format,
      status: 'pending',
      progress: 0,
      options,
      requestedBy,
      createdAt: new Date(),
      startedAt: undefined,
      completedAt: undefined,
      downloadUrl: undefined,
      error: undefined
    };

    this.exports.set(exportJob.id, exportJob);

    try {
      await auditLogger.logUserAction('report_export_started', {
        exportId: exportJob.id,
        reportId,
        format: options.format,
        requestedBy
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    // Start export process
    this.processExport(exportJob);

    return exportJob;
  }

  // Private Methods
  private async generateReportData(reportInstance: ReportInstance, template: ReportTemplate): Promise<void> {
    const startTime = Date.now();
    const sections: SectionData[] = [];

    for (const section of template.sections) {
      try {
        const sectionData = await this.generateSectionData(section, reportInstance.filters, reportInstance.parameters);
        sections.push({
          sectionId: section.id,
          title: section.title,
          type: section.type,
          content: sectionData,
          rendered: true
        });
      } catch (error) {
        sections.push({
          sectionId: section.id,
          title: section.title,
          type: section.type,
          content: null,
          rendered: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    reportInstance.data.sections = sections;
    reportInstance.data.summary = {
      totalSections: sections.length,
      renderedSections: sections.filter(s => s.rendered).length,
      dataPoints: sections.reduce((sum, s) => sum + (s.content ? Object.keys(s.content).length : 0), 0),
      lastUpdated: new Date(),
      generationTime: Date.now() - startTime
    };

    reportInstance.status = 'ready';
    reportInstance.generatedAt = new Date();
    reportInstance.updatedAt = new Date();

    this.instances.set(reportInstance.id, reportInstance);

    try {
      await auditLogger.logUserAction('report_generation_completed', {
        reportId: reportInstance.id,
        generationTime: reportInstance.data.summary.generationTime,
        sectionsRendered: reportInstance.data.summary.renderedSections
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }
  }

  private async generateSectionData(section: ReportSection, filters: ReportFilter[], parameters: Record<string, any>): Promise<any> {
    switch (section.type) {
      case 'header':
        return {
          title: section.content.text || section.title,
          level: 1
        };

      case 'summary':
        return {
          text: section.content.text || 'Summary content',
          metrics: this.generateSummaryMetrics()
        };

      case 'chart':
        return this.generateChartData(section.content.chartConfig!);

      case 'table':
        return this.generateTableData(section.content.tableConfig!);

      case 'metric':
        return this.generateMetricData(section.content.metricConfig!);

      case 'text':
        return {
          content: section.content.text || 'Text content',
          formatted: true
        };

      case 'image':
        return {
          src: section.content.imageConfig?.src || '/placeholder-image.png',
          alt: section.content.imageConfig?.alt || 'Image',
          caption: section.content.imageConfig?.caption
        };

      default:
        return {};
    }
  }

  private generateSummaryMetrics(): Record<string, any> {
    return {
      totalProperties: 1250,
      averageValue: 275000,
      totalGrowth: 5.2,
      marketTrend: 'rising',
      topPerformer: 'London',
      insights: [
        'Property values increased by 5.2% this quarter',
        'London continues to lead market performance',
        'Strong demand in suburban areas'
      ]
    };
  }

  private generateChartData(config: ChartConfig): any {
    return {
      type: config.type,
      title: config.title,
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Property Values',
          data: [250000, 260000, 255000, 270000, 275000, 280000],
          backgroundColor: config.colors[0] || '#3A7CA5',
          borderColor: config.colors[0] || '#3A7CA5',
          borderWidth: 2,
          fill: false
        }]
      },
      options: config.options
    };
  }

  private generateTableData(config: TableConfig): any {
    return {
      title: config.title,
      headers: config.headers,
      data: [
        {
          id: '1',
          data: {
            property: '123 Main St',
            value: 250000,
            growth: 5.2,
            yield: 4.8
          }
        },
        {
          id: '2',
          data: {
            property: '456 Oak Ave',
            value: 320000,
            growth: 3.1,
            yield: 3.9
          }
        },
        {
          id: '3',
          data: {
            property: '789 Pine Rd',
            value: 180000,
            growth: 7.8,
            yield: 5.2
          }
        }
      ]
    };
  }

  private generateMetricData(config: MetricConfig): any {
    return {
      title: config.title,
      value: config.value,
      format: config.format,
      change: config.change || {
        value: 5.2,
        type: 'increase',
        period: 'vs last month',
        format: 'percentage'
      },
      comparison: config.comparison || {
        label: 'Market Average',
        value: 275000,
        format: 'currency'
      }
    };
  }

  private async processExport(exportJob: ExportJob): Promise<void> {
    exportJob.status = 'processing';
    exportJob.startedAt = new Date();
    this.exports.set(exportJob.id, exportJob);

    try {
      // Simulate export process
      const steps = [
        'Preparing report data...',
        'Generating document structure...',
        'Rendering charts and tables...',
        'Applying styling and formatting...',
        'Finalizing export...'
      ];

      for (let i = 0; i < steps.length; i++) {
        exportJob.progress = Math.round(((i + 1) / steps.length) * 100);
        this.exports.set(exportJob.id, exportJob);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      exportJob.status = 'completed';
      exportJob.completedAt = new Date();
      exportJob.downloadUrl = `/api/reports/export/${exportJob.id}/download`;
      this.exports.set(exportJob.id, exportJob);

      try {
        await auditLogger.logUserAction('report_export_completed', {
          exportId: exportJob.id,
          format: exportJob.format,
          duration: exportJob.completedAt.getTime() - exportJob.startedAt!.getTime()
        });
      } catch (error) {
        console.debug('Audit logging skipped (development mode)');
      }

    } catch (error) {
      exportJob.status = 'error';
      exportJob.error = error instanceof Error ? error.message : 'Unknown error';
      exportJob.completedAt = new Date();
      this.exports.set(exportJob.id, exportJob);

      try {
        await auditLogger.logUserAction('report_export_failed', {
          exportId: exportJob.id,
          error: exportJob.error
        });
      } catch (auditError) {
        console.debug('Audit logging skipped (development mode)');
      }
    }
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: ReportTemplate[] = [
      {
        id: crypto.randomUUID(),
        name: 'Executive Summary Report',
        description: 'High-level overview of property market performance',
        category: 'executive',
        type: 'summary',
        sections: [
          {
            id: crypto.randomUUID(),
            title: 'Market Overview',
            type: 'header',
            content: { text: 'Property Market Executive Summary' },
            layout: { width: 100, height: 50, margin: { top: 0, right: 0, bottom: 20, left: 0 }, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
            conditional: { enabled: false, conditions: [], operator: 'AND' },
            order: 1
          },
          {
            id: crypto.randomUUID(),
            title: 'Key Metrics',
            type: 'metric',
            content: {
              metricConfig: {
                title: 'Average Property Value',
                value: 275000,
                format: 'currency',
                change: {
                  value: 5.2,
                  type: 'increase',
                  period: 'vs last quarter',
                  format: 'percentage'
                },
                styling: {
                  backgroundColor: '#f8f9fa',
                  textColor: '#333',
                  borderColor: '#dee2e6',
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 20,
                  fontSize: 16,
                  fontWeight: 'normal'
                }
              }
            },
            layout: { width: 33, height: 100, margin: { top: 0, right: 10, bottom: 0, left: 0 }, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
            conditional: { enabled: false, conditions: [], operator: 'AND' },
            order: 2
          },
          {
            id: crypto.randomUUID(),
            title: 'Market Trends',
            type: 'chart',
            content: {
              chartConfig: {
                type: 'line',
                title: 'Property Value Trends',
                xAxis: { title: 'Month', type: 'category' },
                yAxis: { title: 'Value (£)', type: 'linear', format: 'currency' },
                data: {
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    label: 'Average Property Value',
                    data: [250000, 260000, 255000, 270000, 275000, 280000],
                    backgroundColor: 'rgba(58, 124, 165, 0.1)',
                    borderColor: '#3A7CA5',
                    borderWidth: 2,
                    fill: false
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: 'top', align: 'center' },
                    tooltip: { enabled: true, mode: 'index', intersect: false },
                    title: { display: true, text: 'Property Value Trends', font: { family: 'Arial', size: 16, weight: 'bold' }, color: '#333', padding: 20 }
                  }
                },
                colors: ['#3A7CA5', '#5DA271', '#D4AF37'],
                responsive: true
              }
            },
            layout: { width: 67, height: 300, margin: { top: 0, right: 0, bottom: 0, left: 10 }, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
            conditional: { enabled: false, conditions: [], operator: 'AND' },
            order: 3
          }
        ],
        styling: {
          theme: 'corporate',
          colors: {
            primary: '#3A7CA5',
            secondary: '#5DA271',
            accent: '#D4AF37',
            background: '#ffffff',
            surface: '#f8f9fa',
            text: '#333333',
            textSecondary: '#666666',
            border: '#dee2e6',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
          },
          typography: {
            fontFamily: 'Arial, sans-serif',
            fontSize: { base: 14, small: 12, large: 16, xlarge: 20 },
            fontWeight: { normal: 'normal', bold: 'bold' },
            lineHeight: 1.5
          },
          spacing: { unit: 8, small: 8, medium: 16, large: 24, xlarge: 32 },
          layout: { maxWidth: 1200, columns: 12, gutter: 16, margin: 20 }
        },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Public getters
  getTemplate(templateId: string): ReportTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getAllTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  getReportInstance(reportId: string): ReportInstance | null {
    return this.instances.get(reportId) || null;
  }

  getAllReportInstances(): ReportInstance[] {
    return Array.from(this.instances.values());
  }

  getExportJob(exportId: string): ExportJob | null {
    return this.exports.get(exportId) || null;
  }

  getAllExportJobs(): ExportJob[] {
    return Array.from(this.exports.values());
  }

  getReportingStats(): {
    totalTemplates: number;
    totalReports: number;
    totalExports: number;
    averageGenerationTime: number;
    successRate: number;
  } {
    const templates = this.getAllTemplates();
    const reports = this.getAllReportInstances();
    const exports = this.getAllExportJobs();

    const totalTemplates = templates.length;
    const totalReports = reports.length;
    const totalExports = exports.length;

    const averageGenerationTime = reports.length > 0 
      ? reports.reduce((sum, r) => sum + r.data.summary.generationTime, 0) / reports.length 
      : 0;

    const successRate = exports.length > 0 
      ? exports.filter(e => e.status === 'completed').length / exports.length 
      : 0;

    return {
      totalTemplates,
      totalReports,
      totalExports,
      averageGenerationTime,
      successRate
    };
  }
}

export interface ExportJob {
  id: string;
  reportId: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  options: ExportOptions;
  requestedBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
}

// Export singleton instance
export const reportBuilder = ReportBuilder.getInstance();
