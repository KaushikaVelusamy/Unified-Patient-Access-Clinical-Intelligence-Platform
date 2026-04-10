import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import {
  listFlags,
  getFlag,
  updateFlag,
  invalidateCache,
  getFlagAnalytics,
} from '../controllers/featureFlagController';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, authorize('admin'));

/** GET  /api/admin/feature-flags */
router.get('/', listFlags);

/** GET  /api/admin/feature-flags/:flagName */
router.get('/:flagName', getFlag);

/** PUT  /api/admin/feature-flags/:flagName */
router.put('/:flagName', updateFlag);

/** POST /api/admin/feature-flags/:flagName/invalidate-cache */
router.post('/:flagName/invalidate-cache', invalidateCache);

/** GET  /api/admin/feature-flags/:flagName/analytics */
router.get('/:flagName/analytics', getFlagAnalytics);

export default router;
