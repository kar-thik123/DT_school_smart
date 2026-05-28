"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
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
const app = (0, express_1.default)();
console.log('Starting application, mounting routes...');
// app.use(cors());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:4200',
        'http://144.91.71.246'
    ],
    credentials: true,
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
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
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
exports.default = app;
