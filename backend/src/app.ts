import express from 'express';
import cors from 'cors';
import organizationRoutes from './routes/organization.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import academicRoutes from './routes/academic.routes';
import roleRoutes from './routes/role.routes';
import teacherAssignmentRoutes from './routes/teacher-assignment.routes';
import studentEnrollmentRoutes from './routes/student-enrollment.routes';
import questionBankRoutes from './routes/question-bank.routes';
import practiceRoutes from './routes/practice.routes';
import analyticsRoutes from './routes/analytics.routes';
import bulkImportRoutes from './routes/bulk-import.routes';
import mailRoutes from './routes/mail.routes';
import notificationRoutes from './routes/notification.routes';
import curriculumRoutes from './routes/curriculum.routes';
import settingsRoutes from './routes/settings.routes';
import completionRoutes from './routes/completion.routes';
import studentMcqRoutes from './routes/student-mcq.routes';
import skillRoutes from './routes/skill.routes';
import skillAssignmentRoutes from './routes/skill-assignment.routes';

const app = express();
console.log('Starting application, mounting routes...');

// app.use(cors());
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://144.91.71.246'
  ],
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/organizations', organizationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/teacher-assignments', teacherAssignmentRoutes);
app.use('/api/student-enrollments', studentEnrollmentRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bulk-import', bulkImportRoutes);
app.use('/api/mails', mailRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/completion', completionRoutes);
app.use('/api/student-mcq', studentMcqRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/skill-assignment', skillAssignmentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
