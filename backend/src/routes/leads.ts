import { Router } from 'express';
import { LeadsController } from '../controllers/leadsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, LeadsController.getLeads);
router.get('/saved', authenticateToken, LeadsController.getSaved);
router.get('/export/csv', authenticateToken, LeadsController.exportCSV);
router.get('/export/xlsx', authenticateToken, LeadsController.exportExcel);
router.get('/:id', authenticateToken, LeadsController.getLeadById);
router.post('/', authenticateToken, LeadsController.createLead);
router.patch('/:id', authenticateToken, LeadsController.updateLead);
router.delete('/:id', authenticateToken, LeadsController.deleteLead);

router.post('/bulk-status', authenticateToken, LeadsController.bulkUpdateStatus);
router.post('/bulk-delete', authenticateToken, LeadsController.bulkDelete);

router.post('/:id/save', authenticateToken, LeadsController.toggleSave);
router.post('/:id/notes', authenticateToken, LeadsController.addNote);
router.delete('/notes/:noteId', authenticateToken, LeadsController.deleteNote);

export default router;
