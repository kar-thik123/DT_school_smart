"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const organization_routes_1 = __importDefault(require("./routes/organization.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const academic_routes_1 = __importDefault(require("./routes/academic.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const teacher_assignment_routes_1 = __importDefault(require("./routes/teacher-assignment.routes"));
const student_enrollment_routes_1 = __importDefault(require("./routes/student-enrollment.routes"));
const question_bank_routes_1 = __importDefault(require("./routes/question-bank.routes"));
const practice_routes_1 = __importDefault(require("./routes/practice.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const bulk_import_routes_1 = __importDefault(require("./routes/bulk-import.routes"));
const mail_routes_1 = __importDefault(require("./routes/mail.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const curriculum_routes_1 = __importDefault(require("./routes/curriculum.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const completion_routes_1 = __importDefault(require("./routes/completion.routes"));
const student_mcq_routes_1 = __importDefault(require("./routes/student-mcq.routes"));
const skill_routes_1 = __importDefault(require("./routes/skill.routes"));
const skill_assignment_routes_1 = __importDefault(require("./routes/skill-assignment.routes"));
const student_dashboard_routes_1 = __importDefault(require("./routes/student-dashboard.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
const staff_attendance_routes_1 = __importDefault(require("./routes/staff-attendance.routes"));
const examination_routes_1 = __importDefault(require("./routes/examination.routes"));
const student_exam_result_routes_1 = __importDefault(require("./routes/student-exam-result.routes"));
const teacher_dashboard_routes_1 = __importDefault(require("./routes/teacher-dashboard.routes"));
const app = (0, express_1.default)();
// Trust proxy to securely resolve frontend base URLs (protocol/host) behind reverse proxies.
app.set('trust proxy', 1);
console.log('Starting application, mounting routes...');
// app.use(cors());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:4200',
        'http://144.91.71.246'
    ],
    credentials: true,
}));
// Security Headers
app.use((0, helmet_1.default)());
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    // windowMs: 15 * 60 * 1000, // 15 minutes
    // max: 100, // limit each IP to 100 requests per windowMs
    windowMs: 5 * 1000, // 5 seconds for development testing
    max: 1000,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ limit: '2mb', extended: true }));
app.use('/api/uploads', express_1.default.static('uploads'));
app.use('/api/organizations', organization_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/roles', role_routes_1.default);
app.use('/api/academic', academic_routes_1.default);
app.use('/api/teacher-assignments', teacher_assignment_routes_1.default);
app.use('/api/student-enrollments', student_enrollment_routes_1.default);
app.use('/api/question-bank', question_bank_routes_1.default);
app.use('/api/practice', practice_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/bulk-import', bulk_import_routes_1.default);
app.use('/api/mails', mail_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/curriculum', curriculum_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/completion', completion_routes_1.default);
app.use('/api/student-mcq', student_mcq_routes_1.default);
app.use('/api/skills', skill_routes_1.default);
app.use('/api/skill-assignment', skill_assignment_routes_1.default);
app.use('/api/student-dashboard', student_dashboard_routes_1.default);
app.use('/api/attendance', attendance_routes_1.default);
app.use('/api/staff-attendance', staff_attendance_routes_1.default);
app.use('/api/examinations', examination_routes_1.default);
app.use('/api/student-exam-results', student_exam_result_routes_1.default);
app.use('/api/teacher-dashboard', teacher_dashboard_routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
exports.default = app;
