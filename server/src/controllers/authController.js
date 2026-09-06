import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { HttpError, asyncHandler } from '../utils/error.js';
import { issueSession, rotateSession, revokeSession } from '../utils/tokens.js';
import jwt from 'jsonwebtoken';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  lastActiveWorkspaceId: user.lastActiveWorkspaceId,
});

const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 7);
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) {
    throw new HttpError(422, 'Name, email, and password are required');
  }
  if (String(password).length < 8) {
    throw new HttpError(422, 'Password must be at least 8 characters long');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const user = await User.create({ 
    name: name.trim(), 
    email: normalizedEmail, 
    password 
  });
  
  await issueSession(res, user._id, req);
  res.status(201).json({ success: true, user: sanitizeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new HttpError(422, 'Email and password are required');
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  await issueSession(res, user._id, req);
  res.json({ success: true, user: sanitizeUser(user) });
});

export const refresh = asyncHandler(async (req, res) => {
  const userId = await rotateSession(req, res);
  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, 'User no longer exists');
  res.json({ success: true, user: sanitizeUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  await revokeSession(req, res);
  res.json({ success: true, ok: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

export const setActiveWorkspace = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const isMember = workspace.members.some(
    (m) => m.userId.toString() === req.user._id.toString()
  );
  if (!isMember && workspace.ownerId?.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'Not authorized to access this workspace');
  }

  req.user.lastActiveWorkspaceId = workspaceId;
  await req.user.save();
  
  res.json({ success: true, user: sanitizeUser(req.user) });
});

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.cookies.accessToken;

    if (!token) {
      throw new HttpError(401, 'Please login to access this route');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new HttpError(401, 'User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(new HttpError(401, 'Invalid or expired session'));
  }
};

export const createWorkspace = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    throw new HttpError(422, 'Workspace name is required');
  }

  const workspace = await Workspace.create({
    name: name.trim(),
    slug: generateSlug(name),
    ownerId: req.user._id,
    members: [{ userId: req.user._id, role: 'Owner' }],
  });

  if (!req.user.workspaces) {
    req.user.workspaces = [];
  }

  req.user.workspaces.push({ workspaceId: workspace._id, role: 'Owner' });
  req.user.lastActiveWorkspaceId = workspace._id;
  await req.user.save();

  res.status(201).json({ success: true, workspace });
});