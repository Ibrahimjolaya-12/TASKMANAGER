import express from 'express';
import cors from 'cors';
import dns from "dns"
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
const allowedOrigins = [
  'http://localhost:5173',
  'https://taskmanager-frontend-wine-zeta.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

if(process.env.ENV !== "production"){
  dns.setServers(["8.8.8.8", "1.1.1.1"])
}

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'healthy' }));
app.get("/", (req, res) => {
  res.send("Server is running successfully...")
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;