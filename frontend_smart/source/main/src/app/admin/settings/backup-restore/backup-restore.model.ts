export interface IBackupRestore {
  id: number;
  backupName: string;
  backupDate: string;
  backupSize: string;
  backupType: string;
  triggeredBy: string;
  storageLocation: string;
  status: string;
}

export class BackupRestore implements IBackupRestore {
  id: number;
  backupName: string;
  backupDate: string;
  backupSize: string;
  backupType: string;
  triggeredBy: string;
  storageLocation: string;
  status: string;

  constructor(backup: Partial<BackupRestore>) {
    this.id = backup.id || this.getRandomID();
    this.backupName = backup.backupName || '';
    this.backupDate = backup.backupDate || new Date().toISOString();
    this.backupSize = backup.backupSize || '';
    this.backupType = backup.backupType || '';
    this.triggeredBy = backup.triggeredBy || '';
    this.storageLocation = backup.storageLocation || '';
    this.status = backup.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
