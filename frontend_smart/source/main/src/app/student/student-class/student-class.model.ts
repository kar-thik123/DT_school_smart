export interface ClassModel {
  id: string;
  className: string;
  subjects: string[];
  teachers: string[];
  schedule: {
    days: string[];
    time: string;
  };
}