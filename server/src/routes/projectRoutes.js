import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole, ALL_ROLES } from '../middleware/rbac.js';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from '../controllers/projectController.js';
import { listTasks, createTask, bulkUpdateTasks } from '../controllers/taskController.js';

const router = Router();

const READ = ALL_ROLES; // Owner/Admin/Member/Viewer
const WRITE = ['Owner', 'Admin', 'Member']; // Viewer is read-only

router.use(requireAuth);

// Project item + members
router.route('/:projectId')
  .get(requireProjectRole(READ), getProject)
  .patch(requireProjectRole(['Owner', 'Admin']), updateProject)
  .delete(requireProjectRole(['Owner', 'Admin']), deleteProject);

router.post('/:projectId/members/:userId', requireProjectRole(['Owner', 'Admin']), addProjectMember);
router.delete('/:projectId/members/:userId', requireProjectRole(['Owner', 'Admin']), removeProjectMember);

// Task collection, scoped to a project
router.get('/:projectId/tasks', requireProjectRole(READ), listTasks);
router.post('/:projectId/tasks', requireProjectRole(WRITE), createTask);
router.patch('/:projectId/tasks/bulk', requireProjectRole(WRITE), bulkUpdateTasks);

export default router;