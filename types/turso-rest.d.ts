declare module '@/lib/turso-rest' {
  export function executeQuery(query: string, params?: any[]): Promise<any>;
  export function getRows(query: string, params?: any[]): Promise<any[]>;
  export function getFirstRow(query: string, params?: any[]): Promise<any | null>;
  export function execute(query: string, params?: any[]): Promise<any>;
}
