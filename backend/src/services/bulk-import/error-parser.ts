import path from 'path';

export interface ParsedError {
  success: false;
  errorType: string;
  exceptionName: string;
  message: string;
  prismaCode?: string;
  constraint?: string;
  file?: string;
  function?: string;
  line?: number;
  stack?: string;
  failedRow?: number;
  failedEmail?: string;
  failedRole?: string;
  failedGrade?: string;
  failedSection?: string;
  failedOrganization?: string;
  failedField?: string;
  failedDbOperation?: string;
  httpStatus: number;
}

export function parseError(error: any, context?: {
  failedRow?: number;
  failedEmail?: string;
  failedRole?: string;
  failedGrade?: string;
  failedSection?: string;
  failedOrganization?: string;
  failedField?: string;
  failedDbOperation?: string;
  httpStatus?: number;
}): ParsedError {
  const stack = error.stack || '';
  const lines = stack.split('\n');
  let file = 'Unknown';
  let func = 'Unknown';
  let lineNo: number | undefined = undefined;

  for (let idx = 1; idx < lines.length; idx++) {
    const match = lines[idx].match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || lines[idx].match(/at\s+(.+?):(\d+):(\d+)/);
    if (match) {
      const possiblePath = match[2] || match[1];
      if (possiblePath) {
        // Extract just the filename without the full path for readability
        try {
          file = path.basename(possiblePath);
        } catch {
          file = possiblePath;
        }
        func = match[2] ? match[1] : 'Anonymous';
        lineNo = parseInt(match[2] ? match[3] : match[2], 10);
        break;
      }
    }
  }

  let httpStatus = context?.httpStatus || (error.statusCode ? Number(error.statusCode) : 500);
  if (error.name === 'PrismaClientKnownRequestError') {
    // Use appropriate status codes for common Prisma errors
    if (['P2002', 'P2003', 'P2004', 'P2005', 'P2006', 'P2007', 'P2010', 'P2011', 'P2012', 'P2013', 'P2014', 'P2015', 'P2016', 'P2017', 'P2018', 'P2019', 'P2020', 'P2021', 'P2022', 'P2025'].includes(error.code)) {
      httpStatus = 400;
    }
  }

  return {
    success: false,
    errorType: error.name || error.constructor.name || 'Error',
    exceptionName: error.name || error.constructor.name || 'Error',
    message: error.message || 'An unknown error occurred',
    prismaCode: error.code,
    constraint: error.meta?.constraint,
    file,
    function: func,
    line: lineNo,
    stack,
    failedRow: context?.failedRow,
    failedEmail: context?.failedEmail,
    failedRole: context?.failedRole,
    failedGrade: context?.failedGrade,
    failedSection: context?.failedSection,
    failedOrganization: context?.failedOrganization,
    failedField: context?.failedField,
    failedDbOperation: context?.failedDbOperation,
    httpStatus,
  };
}
