import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Log full error to console for observability
    console.error('[GlobalErrorHandler] Unhandled error caught:', error);

    // Extract useful info
    const message = error?.message || 'Unknown error';
    const stack = error?.stack || '';
    const timestamp = new Date().toISOString();

    // Structured log for monitoring/debugging
    console.error(JSON.stringify({
      timestamp,
      message,
      stack: stack.substring(0, 500),
      source: 'GlobalErrorHandler'
    }));
  }
}
