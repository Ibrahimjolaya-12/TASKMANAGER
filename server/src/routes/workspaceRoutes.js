import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspaceRole, ALL_ROLES } from '../middleware/rbac.js';
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  updateMemberRole,
  removeMember,
} from '../controllers/workspaceController.js';
import { createProject, listProjects } from '../controllers/projectController.js';

const router = Router();

// 1. All routes below this line are protected by cookie auth
router.use(requireAuth);

// 2. Base Workspace Routes
router.get('/', getMyWorkspaces);
router.post('/', createWorkspace);

// 3. Workspace-Level Resource Routes (Role Protected)
router
  .route('/:workspaceId')
  .get(requireWorkspaceRole(ALL_ROLES), getWorkspace)
  .patch(requireWorkspaceRole(['Owner', 'Admin']), updateWorkspace)
  .delete(requireWorkspaceRole(['Owner']), deleteWorkspace);

// 4. Members Management Routes
router.get('/:workspaceId/members', requireWorkspaceRole(ALL_ROLES), getWorkspace);
router.post('/:workspaceId/members', requireWorkspaceRole(['Owner', 'Admin']), addMember);
router.patch('/:workspaceId/members/:userId', requireWorkspaceRole(['Owner']), updateMemberRole);
router.delete('/:workspaceId/members/:userId', requireWorkspaceRole(['Owner', 'Admin']), removeMember);

// 5. Projects Workspace-Scoped Routes
router.get('/:workspaceId/projects', requireWorkspaceRole(ALL_ROLES), listProjects);
router.post('/:workspaceId/projects', requireWorkspaceRole(['Owner', 'Admin']), createProject);

export default router;