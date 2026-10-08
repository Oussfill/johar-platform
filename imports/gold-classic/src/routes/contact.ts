import { Router } from 'express';
import * as ContactController from '../controllers/ContactController';

const router = Router();

router.post('/inquiry', ContactController.submitInquiry);

export default router;