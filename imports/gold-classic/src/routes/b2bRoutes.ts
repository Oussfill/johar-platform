import { Router } from 'express';
import * as B2B from '../controllers/B2bController';
import * as ContactController from '../controllers/ContactController';
import { authenticateToken } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

// ============================================================================
// PUBLIC & B2B SERVICES ROUTES
// Public endpoints are mounted at /api/v1, admin endpoints at /api/v1/admin/content
// ============================================================================

export const b2bPublicRoutes = Router();

// Newsletter (public)
b2bPublicRoutes.post('/newsletter/subscribe', B2B.subscribeNewsletter);
b2bPublicRoutes.post('/newsletter/unsubscribe', B2B.unsubscribeNewsletter);

// Articles (public)
b2bPublicRoutes.get('/articles', B2B.listArticles);
b2bPublicRoutes.get('/articles/:slug', B2B.getArticleBySlug);

// Exhibitors directory (public)
b2bPublicRoutes.get('/exhibitors', B2B.listExhibitors);
b2bPublicRoutes.get('/exhibitors/:id', B2B.getExhibitor);

// Buyer program (public)
b2bPublicRoutes.post('/buyer-program', B2B.submitBuyerProgram);

// Contact (public)
b2bPublicRoutes.post('/contact/inquiry', ContactController.submitInquiry);

export const b2bAdminRoutes = Router();

b2bAdminRoutes.use(authenticateToken, requireRoles('admin'));

// Newsletter administration
b2bAdminRoutes.get('/newsletter', B2B.listNewsletter);
b2bAdminRoutes.delete('/newsletter/:id', B2B.deleteNewsletter);

// Articles administration (CRUD)
b2bAdminRoutes.get('/articles', B2B.adminListArticles);
b2bAdminRoutes.post('/articles', B2B.createArticle);
b2bAdminRoutes.put('/articles/:id', B2B.updateArticle);
b2bAdminRoutes.delete('/articles/:id', B2B.deleteArticle);

// Buyer program administration
b2bAdminRoutes.get('/buyer-program', B2B.listBuyerProgram);
b2bAdminRoutes.patch('/buyer-program/:id/status', B2B.updateBuyerProgramStatus);

// Contact messages administration
b2bAdminRoutes.get('/contact-messages', ContactController.listInquiries);
b2bAdminRoutes.patch('/contact-messages/:id/status', ContactController.updateInquiryStatus);