import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AcademicRuleService } from '../../academic-rule.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  ruleName: string;
}

@Component({
  selector: 'app-academic-rule-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogClose],
})
export class AcademicRuleDeleteComponent {
  dialogRef = inject<MatDialogRef<AcademicRuleDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  academicRuleService = inject(AcademicRuleService);

  confirmDelete(): void {
    this.academicRuleService.deleteRule(this.data.id).subscribe({
      next: (response) => { this.dialogRef.close(response); },
      error: (error) => { console.error('Delete Error:', error); },
    });
  }
}
