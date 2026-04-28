import { Router } from 'express';
import { listSportsHandler } from './sports.controller';

const router = Router();

router.get('/', listSportsHandler);

export default router;
