export interface TeacherTimetable {
  day: string;
  schedules: ClassSchedule[];
}

export interface ClassSchedule {
  class: string;
  subject: string;
  subjectCode: string;
  time: string;
  roomNo: string;
}

export interface Teacher {
  id: string;
  name: string;
}

export interface TimetableResponse {
  [teacherId: string]: TeacherTimetable[];
}
