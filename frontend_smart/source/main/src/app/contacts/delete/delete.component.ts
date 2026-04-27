import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { ContactsService } from '../contacts.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  name: string;
  email: string;
  mobile: string;
}

@Component({
  selector: 'app-contact-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatDialogClose,
  ],
})
export class ContactDeleteComponent {
  dialogRef = inject<MatDialogRef<ContactDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  contactsService = inject(ContactsService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.contactsService.deleteContact(this.data.id);
  }
}
