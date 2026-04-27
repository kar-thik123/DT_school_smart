import { Component, OnInit, inject } from '@angular/core';
import { MatDialog, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
@Component({
    selector: 'app-dialogform',
    templateUrl: './dialogform.component.html',
    styleUrls: ['./dialogform.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
    ]
})
export class DialogformComponent implements OnInit {
  private fb = inject(UntypedFormBuilder);
  dialog = inject(MatDialog);

  public fname = 'John';
  public lname = 'Deo';
  public addCusForm!: UntypedFormGroup;
  public ngOnInit(): void {
    this.addCusForm = this.fb.group({
      IdProof: null,
      firstname: [
        this.fname,
      ],
      lastname: [
        this.lname,
      ],
      email: [null,],
    });
  }
  closeDialog(): void {
    this.dialog.closeAll();
  }
  onSubmitClick() {
    console.log('Form Value', this.addCusForm.value);
  }
}
