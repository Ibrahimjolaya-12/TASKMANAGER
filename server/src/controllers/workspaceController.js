import slugify from 'slugify';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { HttpError, asyncHandler } from '../utils/error.js';

const uniqueSlug = async (name) => {
  const base = slugify(name, { lower: true, strict: true }) || 'workspace';
  let slug = base;
  let i = 1;
  while (await Workspace.exists({ slug })) {
    slug = `${base}-${i++}`;
  }
  return slug;
};

export const createWorkspace = asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (!name?.trim()) throw new HttpError(422, 'Workspace name is required');

  const workspace = await Workspace.create({
    name: name.trim(),
    slug: await uniqueSlug(name),
    ownerId: req.user._id,
    members: [{ userId: req.user._id, role: 'Owner' }], // Creator hamesha Owner hoga
  });

  req.user.workspaces.push({ workspaceId: workspace._id, role: 'Owner' });
  req.user.lastActiveWorkspaceId = workspace._id;
  await req.user.save();

  res.status(201).json({ success: true, workspace });
});

export const getMyWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({ 'members.userId': req.user._id })
    .select('name slug logo ownerId members')
    .lean();
  res.json({ success: true, workspaces });
});

export const getWorkspace = asyncHandler(async (req, res) => {
  if (!req.workspace) throw new HttpError(404, 'Workspace not found');

  const workspace = await Workspace.findById(req.workspace._id)
    .populate('members.userId', 'name email avatar')
    .lean();
    
  res.json({ success: true, workspace });
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  if (!req.workspace) throw new HttpError(404, 'Workspace not found');

  // Only Owner or Admin can update workspace details
  const userRole = req.effectiveRole || 'Viewer';
  if (!['Owner', 'Admin'].includes(userRole)) {
    throw new HttpError(403, 'Only Owners and Admins can update workspace details');
  }

  const { name, logo } = req.body || {};
  if (name !== undefined) {
    if (!name?.trim()) throw new HttpError(422, 'Workspace name cannot be empty');
    req.workspace.name = name.trim();
  }
  if (logo !== undefined) req.workspace.logo = logo;
  
  await req.workspace.save();
  res.json({ success: true, workspace: req.workspace });
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  if (!req.workspace) throw new HttpError(404, 'Workspace not found');

  // STRICTLY OWNER ONLY can delete workspace
  const userRole = req.effectiveRole || 'Viewer';
  if (userRole !== 'Owner') {
    throw new HttpError(403, 'Only the Workspace Owner can delete the workspace');
  }

  const projects = await Project.find({ workspaceId: req.workspace._id }).select('_id').lean();
  await Task.deleteMany({ workspaceId: req.workspace._id });
  await Project.deleteMany({ workspaceId: req.workspace._id });

  await User.updateMany(
    { 'workspaces.workspaceId': req.workspace._id },
    { $pull: { workspaces: { workspaceId: req.workspace._id } } }
  );

  await req.workspace.deleteOne();
  res.json({ success: true, ok: true, removedProjects: projects.length });
});

export const addMember = asyncHandler(async (req, res) => {
  if (!req.workspace) throw new HttpError(404, 'Workspace not found');

  const userRole = req.effectiveRole || 'Viewer';
  if (!['Owner', 'Admin'].includes(userRole)) {
    throw new HttpError(403, 'Not authorized to add members to this workspace');
  }

  const { email } = req.body || {};
  
  // STRICT: Naya add hone wala member by default hamesha 'Viewer' banega!
  const assignedRole = 'Viewer';

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) throw new HttpError(404, 'No registered user with that email');

  if (req.workspace.members.some((m) => m.userId.equals(user._id))) {
    throw new HttpError(409, 'User is already a member');
  }

  req.workspace.members.push({ userId: user._id, role: assignedRole });
  await req.workspace.save();

  user.workspaces.push({ workspaceId: req.workspace._id, role: assignedRole });
  if (!user.lastActiveWorkspaceId) {
    user.lastActiveWorkspaceId = req.workspace._id;
  }
  await user.save();

  res.status(201).json({ 
    success: true, 
    member: { userId: user._id, role: assignedRole, name: user.name, email: user.email, avatar: user.avatar } 
  });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  if (!req.workspace) throw new HttpError(404, 'Workspace not found');

  // STRICTLY OWNER ONLY can change member roles (Admin cannot change roles!)
  const userRole = req.effectiveRole || 'Viewer';
  if (userRole !== 'Owner') {
    throw new HttpError(403, 'Access denied: Only the Workspace Owner can modify member roles');
  }

  const { role } = req.body || {};
  if (!['Admin', 'Member', 'Viewer'].includes(role)) {
    throw new HttpError(422, 'role must be Admin, Member or Viewer');
  }

  const member = req.workspace.members.find((m) => String(m.userId) === req.params.userId);
  if (!member) throw new HttpError(404, 'Member not found');
  if (member.role === 'Owner') throw new HttpError(403, "The owner's role cannot be changed");

  member.role = role;
  await req.workspace.save();

  await User.updateOne(
    { _id: member.userId, 'workspaces.workspaceId': req.workspace._id },
    { $set: { 'workspaces.$.role': role } }
  );

  res.json({ success: true, member });
});

export const removeMember = asyncHandler(async (req, res) => {
  if (!req.workspace) throw new HttpError(404, 'Workspace not found');

  const userRole = req.effectiveRole || 'Viewer';
  if (!['Owner', 'Admin'].includes(userRole)) {
    throw new HttpError(403, 'Not authorized to remove members');
  }

  const member = req.workspace.members.find((m) => String(m.userId) === req.params.userId);
  if (!member) throw new HttpError(404, 'Member not found');
  if (member.role === 'Owner') throw new HttpError(403, 'The owner cannot be removed');

  req.workspace.members = req.workspace.members.filter((m) => !m.userId.equals(member.userId));
  await req.workspace.save();

  await User.updateOne(
    { _id: member.userId },
    { $pull: { workspaces: { workspaceId: req.workspace._id } } }
  );

  res.json({ success: true, ok: true });
});