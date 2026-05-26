import { Component, OnInit, inject } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService, ICompletionSettings } from './settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    MatCardModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    CommonModule,
    FormsModule
  ]
})
export class SettingsComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  private settingsService = inject(SettingsService);

  breadscrums = [{ title: 'Settings', items: ['Administration'], active: 'Settings' }];
  
  settings: ICompletionSettings = {
    enable_notifications: true,
    enable_module: true
  };

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.settingsService.getCompletionSettings().subscribe({
      next: (res) => {
        if (res && res.config_data) {
          this.settings.enable_notifications = res.config_data.enable_notifications ?? true;
          this.settings.enable_module = res.config_data.enable_module ?? true;
        }
      },
      error: (err) => {
        console.error('Failed to load settings', err);
      }
    });
  }

  saveSettings() {
    const payload = { config_data: this.settings };
    this.settingsService.updateCompletionSettings(this.settings).subscribe({
      next: () => {
        this.snackBar.open('Settings Updated Successfully!', '', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'center',
          panelClass: 'snackbar-success',
        });
      },
      error: (err) => {
        console.error('Failed to update settings', err);
        const errorMsg = err?.error?.message || err?.message || 'Failed to update settings';
        this.snackBar.open(errorMsg, '', { duration: 3000 });
      }
    });
  }
}
