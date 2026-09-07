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


// Yeh line lazmi add karo taake JSON data parse ho sakay
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:5173', // Local testing ke liye
  'https://workspace-manager-wine.vercel.app', // Tumhara live Vercel frontend URL
  'http://localhost:5173',
  'https://taskmanager-frontend-wine-zeta.vercel.app' // Yeh wala exact URL daalo
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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