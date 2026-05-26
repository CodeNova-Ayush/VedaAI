import { Router } from 'express';
import { upload } from '../middleware/upload';
import {
  createAssignment,
  listAssignments,
  getAssignment,
  getAssignmentResult,
  deleteAssignment,
  regenerateAssignment,
} from '../controllers/assignmentController';

const router = Router();

router.post('/', upload.single('file'), createAssignment);
router.get('/', listAssignments);
router.get('/:id', getAssignment);
router.get('/:id/result', getAssignmentResult);
router.delete('/:id', deleteAssignment);
router.post('/:id/regenerate', regenerateAssignment);

export default router;
