process.env.UV_THREADPOOL_SIZE = '128';
import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET is not defined in the environment.');
  process.exit(1);
}
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

// Initialize notification listeners
import './services/notification.service';

const PORT = process.env.PORT || 5000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Attach Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(
      token as string,
      process.env.JWT_SECRET as string
    ) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.user_id },
      select: { id: true, organization_id: true, name: true }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user info to socket
    (socket as any).userId = user.id;
    (socket as any).organizationId = user.organization_id;
    (socket as any).userName = user.name;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  const orgId = (socket as any).organizationId;

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
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
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

// Export io and server for use in routes and tests
export { io, server };
// trigger restart
