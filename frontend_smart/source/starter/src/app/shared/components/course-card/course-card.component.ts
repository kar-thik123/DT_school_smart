import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss'],
  imports: [MatIconModule, MatButtonModule],
  standalone: true,
})
export class CourseCardComponent {
  @Input() course: any;
}
