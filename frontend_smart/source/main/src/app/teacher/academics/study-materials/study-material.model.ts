export interface StudyMaterial {
  id: number;
  class: string;
  subject: string;
  title: string;
  type: string; // 'PDF', 'Video', 'PPT', 'Doc'
  uploadDate: string;
  fileUrl: string;
}
