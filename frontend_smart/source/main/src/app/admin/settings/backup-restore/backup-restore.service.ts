import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { BackupRestore, IBackupRestore } from './backup-restore.model';

@Injectable({
  providedIn: 'root',
})
export class BackupRestoreService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<BackupRestore[]> = new BehaviorSubject<BackupRestore[]>([]);

  private staticData: IBackupRestore[] = [
    { id: 1, backupName: 'FULL_BACKUP_20241225', backupDate: '2024-12-25 00:00:01', backupSize: '250 MB', backupType: 'Full', triggeredBy: 'System', storageLocation: 'Cloud Storage', status: 'Completed' },
    { id: 2, backupName: 'DB_INC_20241224', backupDate: '2024-12-24 12:00:05', backupSize: '45 MB', backupType: 'Incremental', triggeredBy: 'admin_john', storageLocation: 'Local Drive', status: 'Completed' },
    { id: 3, backupName: 'MEDIA_FILES_20241220', backupDate: '2024-12-20 03:00:10', backupSize: '1.2 GB', backupType: 'Manual', triggeredBy: 'sarah_m', storageLocation: 'External HDD', status: 'Completed' },
    { id: 4, backupName: 'CONFIG_BACKUP_V1', backupDate: '2024-12-15 09:30:00', backupSize: '5 MB', backupType: 'Manual', triggeredBy: 'will_c', storageLocation: 'Cloud Storage', status: 'Completed' },
    { id: 5, backupName: 'DAILY_SNAPSHOT_23', backupDate: '2024-12-23 23:59:59', backupSize: '150 MB', backupType: 'Snapshot', triggeredBy: 'System', storageLocation: 'Cloud Storage', status: 'Completed' },
    { id: 6, backupName: 'POST_UPGRADE_BAK', backupDate: '2024-12-10 14:00:00', backupSize: '300 MB', backupType: 'Full', triggeredBy: 'System', storageLocation: 'Cloud Storage', status: 'Completed' },
    { id: 7, backupName: 'FEES_DB_202412', backupDate: '2024-12-01 10:15:20', backupSize: '80 MB', backupType: 'Manual', triggeredBy: 'emily_d', storageLocation: 'Local Drive', status: 'Completed' },
    { id: 8, backupName: 'REPORTS_CACHE_BAK', backupDate: '2024-12-18 16:40:00', backupSize: '120 MB', backupType: 'Incremental', triggeredBy: 'mike_j', storageLocation: 'External HDD', status: 'Failed' },
    { id: 9, backupName: 'USER_DOCS_2024', backupDate: '2024-11-30 05:00:00', backupSize: '500 MB', backupType: 'Manual', triggeredBy: 'lisa_b', storageLocation: 'Cloud Storage', status: 'Completed' },
    { id: 10, backupName: 'OLD_ARCHIVE_2023', backupDate: '2023-12-31 23:00:00', backupSize: '2.5 GB', backupType: 'Archival', triggeredBy: 'System', storageLocation: 'Glacier Storage', status: 'Completed' },
    { id: 11, backupName: 'TEMP_BAK_TEST', backupDate: '2024-12-25 11:15:00', backupSize: '10 MB', backupType: 'Manual', triggeredBy: 'admin_john', storageLocation: 'Local Drive', status: 'In Progress' },
    { id: 12, backupName: 'EXAM_DATA_PREP', backupDate: '2024-12-24 20:00:00', backupSize: '60 MB', backupType: 'Manual', triggeredBy: 'amanda_l', storageLocation: 'Cloud Storage', status: 'Completed' },
    { id: 13, backupName: 'SYSTEM_SETTINGS_BAK', backupDate: '2024-12-25 09:00:00', backupSize: '2 MB', backupType: 'Manual', triggeredBy: 'will_c', storageLocation: 'Local Drive', status: 'Completed' },
  ];

  getAllBackups(): Observable<BackupRestore[]> {
    return of(this.staticData as BackupRestore[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addBackup(backup: BackupRestore): Observable<BackupRestore> {
    return of(backup).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateBackup(backup: BackupRestore): Observable<BackupRestore> {
    return of(backup).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteBackup(id: number): Observable<number> {
    return of(id).pipe(
      map((_response) => id),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
}
