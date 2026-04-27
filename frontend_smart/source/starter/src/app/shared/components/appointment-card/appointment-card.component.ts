import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-appointment-card',
    imports: [MatCardModule],
    templateUrl: './appointment-card.component.html',
    styleUrl: './appointment-card.component.scss'
})
export class AppointmentCardComponent {
  readonly totalAppointments = input<number>(0);
  readonly completed = input<number>(0);
  readonly upcoming = input<number>(0);
}
