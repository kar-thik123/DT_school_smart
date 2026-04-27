import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { NgScrollbar } from 'ngx-scrollbar';

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  isRead: boolean;
  sender?: string;
  attachments?: string[];
}

@Component({
  selector: 'app-noticeboard-announcements',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    NgScrollbar,
  ],
  templateUrl: './noticeboard-announcements.component.html',
  styleUrls: ['./noticeboard-announcements.component.scss'],
})
export class NoticeboardAnnouncementsComponent {
  announcements: Announcement[] = [
    {
      id: 1,
      title: 'School Closure Due to Weather',
      content:
        'Due to severe weather conditions, the school will remain closed on Monday, February 12th. All classes and activities are cancelled.',
      date: '2023-02-10',
      urgency: 'critical',
      category: 'Administrative',
      isRead: false,
      sender: 'Principal Johnson',
    },
    {
      id: 2,
      title: 'Annual Sports Day Schedule',
      content:
        'The annual sports day will be held on March 15th. All students are required to participate in at least one event. Registration closes on March 1st.',
      date: '2023-02-15',
      urgency: 'medium',
      category: 'Events',
      isRead: true,
      attachments: ['sports_schedule.pdf'],
    },
    {
      id: 3,
      title: 'Parent-Teacher Meeting',
      content:
        'Parent-teacher meetings will be held on February 25th from 9 AM to 3 PM. Please book your slots in advance through the school portal.',
      date: '2023-02-18',
      urgency: 'high',
      category: 'Meetings',
      isRead: false,
    },
    {
      id: 4,
      title: 'Library Book Return Reminder',
      content:
        'All borrowed library books must be returned by February 28th. Late returns will incur a fine of $1 per day.',
      date: '2023-02-20',
      urgency: 'low',
      category: 'Library',
      isRead: true,
    },
    {
      id: 5,
      title: 'Scholarship Application Deadline',
      content:
        'Applications for the annual merit scholarship are due by March 10th. Eligible students must have a GPA of at least 3.5.',
      date: '2023-02-22',
      urgency: 'high',
      category: 'Scholarships',
      isRead: false,
      attachments: ['scholarship_form.pdf', 'eligibility_criteria.pdf'],
    },
    {
      id: 6,
      title: 'New Cafeteria Menu',
      content:
        'The school cafeteria will be introducing a new menu starting March 1st. The menu includes healthier options and accommodates various dietary restrictions.',
      date: '2023-02-25',
      urgency: 'low',
      category: 'Cafeteria',
      isRead: true,
      attachments: ['new_menu.pdf'],
    },
    {
      id: 7,
      title: 'COVID-19 Protocol Update',
      content:
        'Updated COVID-19 protocols will be implemented starting next week. Masks are now optional but recommended for all students and staff.',
      date: '2023-02-27',
      urgency: 'high',
      category: 'Health',
      isRead: false,
    },
  ];

  categories: string[] = [
    'All',
    'Administrative',
    'Events',
    'Meetings',
    'Library',
    'Scholarships',
    'Cafeteria',
    'Health',
  ];

  selectedCategory: string = 'All';
  activeTab: number = 0;

  // Filter announcements by category
  getFilteredAnnouncements(): Announcement[] {
    if (this.selectedCategory === 'All') {
      return this.announcements;
    }
    return this.announcements.filter(
      (a) => a.category === this.selectedCategory
    );
  }

  // Get unread announcements
  getUnreadAnnouncements(): Announcement[] {
    return this.announcements.filter((a) => !a.isRead);
  }

  // Get urgent announcements (high or critical urgency)
  getUrgentAnnouncements(): Announcement[] {
    return this.announcements.filter(
      (a) => a.urgency === 'high' || a.urgency === 'critical'
    );
  }

  // Mark announcement as read
  markAsRead(announcement: Announcement): void {
    announcement.isRead = true;
  }

  // Get urgency color
  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'low':
        return 'urgency-low';
      case 'medium':
        return 'urgency-medium';
      case 'high':
        return 'urgency-high';
      case 'critical':
        return 'urgency-critical';
      default:
        return '';
    }
  }

  // Get urgency icon
  getUrgencyIcon(urgency: string): string {
    switch (urgency) {
      case 'low':
        return 'info';
      case 'medium':
        return 'notification_important';
      case 'high':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }

  // Format date to readable format
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Get days ago
  getDaysAgo(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  }

  // Set active category
  setCategory(category: string): void {
    this.selectedCategory = category;
  }

  // Get unread count
  getUnreadCount(): number {
    return this.announcements.filter((a) => !a.isRead).length;
  }

  // Get urgent count
  getUrgentCount(): number {
    return this.getUrgentAnnouncements().length;
  }
}
