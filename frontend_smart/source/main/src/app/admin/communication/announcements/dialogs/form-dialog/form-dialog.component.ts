import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AnnouncementService } from '../../announcement.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Announcement } from '../../announcement.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  announcement: Announcement;
}

@Component({
    selector: 'app-announcement-form',
    templateUrl: './form-dialog.component.html',
    styleUrls: ['./form-dialog.component.scss'],
    providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
    imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatInputModule,
        MatDialogClose,
    ]
})
export class AnnouncementFormComponent {
  dialogRef = inject<MatDialogRef<AnnouncementFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  announcementService = inject(AnnouncementService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  announcementForm: UntypedFormGroup;
  announcement: Announcement;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.announcement.title
        : 'New Announcement';
    this.announcement =
      this.action === 'edit'
        ? data.announcement
        : new Announcement({} as Announcement);

    this.announcementForm = this.createAnnouncementForm();
  }

  createAnnouncementForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.announcement.id],
      img: [this.announcement.img],
      title: [this.announcement.title, [Validators.required]],
      announcementType: [this.announcement.announcementType, [Validators.required]],
      description: [this.announcement.description, [Validators.required]],
      startDate: [this.announcement.startDate, [Validators.required]],
      endDate: [this.announcement.endDate, [Validators.required]],
      priority: [this.announcement.priority, [Validators.required]],
      status: [this.announcement.status, [Validators.required]],
      postedBy: [this.announcement.postedBy, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.announcementForm.valid) {
      const formData = this.announcementForm.getRawValue();
      if (this.action === 'edit') {
        this.announcementService.updateAnnouncement(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.announcementService.addAnnouncement(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
          },
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  public confirmAdd(): void {
    this.submit();
  }
}
