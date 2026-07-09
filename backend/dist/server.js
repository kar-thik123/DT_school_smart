"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.io = void 0;
require("dotenv/config");
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET is not defined in the environment.');
    process.exit(1);
}
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("./prisma"));
// Initialize notification listeners
require("./services/notification.service");
const PORT = process.env.PORT || 5000;
// Create HTTP server from Express app
const server = http_1.default.createServer(app_1.default);
exports.server = server;
// Attach Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: (origin, callback) => callback(null, true),
        methods: ['GET', 'POST'],
        credentials: true
    }
});
exports.io = io;
// Socket.io authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.user_id },
            select: { id: true, organization_id: true, name: true }
        });
        if (!user) {
            return next(new Error('User not found'));
        }
        // Attach user info to socket
        socket.userId = user.id;
        socket.organizationId = user.organization_id;
        socket.userName = user.name;
        next();
    }
    catch (error) {
        next(new Error('Invalid token'));
    }
});
// Socket.io connection handler
io.on('connection', (socket) => {
    const userId = socket.userId;
    const orgId = socket.organizationId;
    console.log(`🔌 Socket connected: user ${userId}`);
    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);
    // Join org room for broadcast notifications
    socket.join(`org:${orgId}`);
    socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: user ${userId}`);
    });
});
async function checkDBConnection() {
    try {
        await prisma_1.default.$connect();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}
checkDBConnection();
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`🚀 API Server running proudly on port ${PORT}...`);
        console.log(`🔌 WebSocket server ready`);
    });
}
// trigger restart
