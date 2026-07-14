export type ResolvedDataMap = Record<string, any>;

export interface ValidationResult {
  status: 'VALID' | 'ERROR' | 'CONFLICT' | 'DUPLICATE';
  errors?: string[];
  data: any;
}

export interface CommitResult {
  success_count: number;
  failure_count: number;
  imported_count?: number;
  skipped_count?: number;
  skipped_reasons?: { email: string; reason: string }[];
}

export interface BulkImportProcessor {
  // Processor instances should wrap the organization_id context upon initialization.
  resolveRelations(rows: any[]): Promise<ResolvedDataMap>;
  validateRow(row: any): Promise<ValidationResult>;
  commit(validRows: any[], conflictResolutions?: { mapping_id: string, action: 'MOVE' | 'SKIP' }[], jobId?: string): Promise<CommitResult>;
}
