import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Add member to workspace by email (Default role: Viewer)
// @route   POST /api/v1/workspaces/:workspaceId/members
// @access  Private (Owner/Admin can add members, default to Viewer)
export const addWorkspaceMember = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { email, role } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide user email');
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  // Check if current user has permission (Owner or Admin)
  const requesterMembership = workspace.members.find(
    (m) => m.userId.toString() === req.user._id.toString()
  );

  if (!requesterMembership || !['Owner', 'Admin'].includes(requesterMembership.role)) {
    res.status(403);
    throw new Error('Not authorized to add members to this workspace');
  }

  // Find user by email
  const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (!targetUser) {
    res.status(404);
    throw new Error('User with this email is not registered in the system');
  }

  // Check if user is already a member
  const existingMember = workspace.members.find(
    (m) => m.userId.toString() === targetUser._id.toString()
  );

  if (existingMember) {
    res.status(400);
    throw new Error('User is already a member of this workspace');
  }

  // Enforce strict default role to 'Viewer' unless Owner explicitly sets otherwise (or keep default Viewer)
  const assignedRole = role && requesterMembership.role === 'Owner' ? role : 'Viewer';

  // Add member to workspace
  workspace.members.push({ userId: targetUser._id, role: assignedRole });
  await workspace.save();

  // Update user's workspaces array
  targetUser.workspaces.push({ workspaceId: workspace._id, role: assignedRole });
  if (!targetUser.lastActiveWorkspaceId) {
    targetUser.lastActiveWorkspaceId = workspace._id;
  }
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: 'Member added successfully',
    data: workspace,
  });
});

// @desc    Update workspace member role (Strictly Owner Only)
// @route   PATCH /api/v1/workspaces/:workspaceId/members/:userId
// @access  Private (Owner only)
export const updateWorkspaceMemberRole = asyncHandler(async (req, res) => {
  const { workspaceId, userId } = req.params;
  const { role } = req.body;

  if (!role) {
    res.status(400);
    throw new Error('Please provide a role to update');
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  // Check permissions: STRICTLY OWNER ONLY can modify roles
  const requesterMembership = workspace.members.find(
    (m) => m.userId.toString() === req.user._id.toString()
  );

  if (!requesterMembership || requesterMembership.role !== 'Owner') {
    res.status(403);
    throw new Error('Access denied: Only Workspace Owners can modify member roles');
  }

  const memberToUpdate = workspace.members.find((m) => m.userId.toString() === userId);
  if (!memberToUpdate) {
    res.status(404);
    throw new Error('Member not found in this workspace');
  }

  memberToUpdate.role = role;
  await workspace.save();

  // Update user model workspace role reference
  await User.updateOne(
    { _id: userId, 'workspaces.workspaceId': workspaceId },
    { $set: { 'workspaces.$.role': role } }
  );

  res.status(200).json({
    success: true,
    message: 'Member role updated successfully',
    data: workspace,
  });
});