import { provideZoneChangeDetection, importProvidersFrom } from "@angular/core";
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from 'app/app.component';
import { appConfig } from 'app/app.config';
import { NgApexchartsModule } from 'ng-apexcharts';

bootstrapApplication(AppComponent, {...appConfig, providers: [provideZoneChangeDetection(), ...appConfig.providers, importProvidersFrom(NgApexchartsModule)]}).catch((err) =>
  console.error(err)
);
