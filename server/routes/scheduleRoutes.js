const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createScheduleValidator, updateScheduleValidator } = require('../validators/scheduleValidators');
const {
  getSchedules, searchSchedules, getSchedule,
  createSchedule, updateSchedule, deleteSchedule,
  getSeatMap, generateFromTemplate,
} = require('../controllers/scheduleController');
const {
  getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate,
} = require('../controllers/scheduleTemplateController');

// ── Public routes (no auth) ───────────────────────────────────────────────
router.get('/search',          searchSchedules);
router.get('/:id/seats',       getSeatMap);

// ── Template routes (auth required) ──────────────────────────────────────
router.get('/templates',       protect, getTemplates);
router.get('/templates/:id',   protect, getTemplate);
router.post('/templates',      protect, authorize('admin', 'dispatcher'), createTemplate);
router.patch('/templates/:id', protect, authorize('admin', 'dispatcher'), updateTemplate);
router.delete('/templates/:id',protect, authorize('admin'), deleteTemplate);

// ── Generate from template ────────────────────────────────────────────────
router.post('/generate-from-template', protect, authorize('admin', 'dispatcher'), generateFromTemplate);

// ── Schedule CRUD (auth required) ────────────────────────────────────────
router.use(protect);
router.get('/',    getSchedules);
router.get('/:id', getSchedule);
router.post('/',   authorize('admin', 'dispatcher'), createScheduleValidator, validate, createSchedule);
router.patch('/:id', authorize('admin', 'dispatcher'), updateScheduleValidator, validate, updateSchedule);
router.delete('/:id', authorize('admin'), deleteSchedule);

module.exports = router;
