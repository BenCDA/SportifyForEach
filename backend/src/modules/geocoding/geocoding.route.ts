import { Router } from 'express';
import { geocodeSearchHandler } from './geocoding.controller';

const router = Router();

router.get('/search', geocodeSearchHandler);

export default router;
