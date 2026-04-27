import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

interface Document {
  title: string;
  type: string;
  size: number;
  icon: string;
  iconClass: string;
  textClass: string;
}

@Component({
    selector: 'app-document-list',
    imports: [NgClass],
    templateUrl: './document-list.component.html',
    styleUrl: './document-list.component.scss'
})
export class DocumentListComponent {
  readonly documents = input<Document[]>([]);

  onDelete(document: Document) {
    // Handle document deletion
    console.log('Deleting document:', document.title);
  }

  onDownload(document: Document) {
    // Handle document download
    console.log('Downloading document:', document.title);
  }
}
