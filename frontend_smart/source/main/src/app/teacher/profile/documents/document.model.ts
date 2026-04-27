export interface MyDocument {
  id: number;
  name: string;
  type: string; // 'ID Proof', 'Degree', 'Contract', 'Certificate'
  uploadDate: string;
  size: string;
  fileUrl: string;
  file?: File; // Optional file object for upload
}
