// ============================================================================
// JOHAR — ERP ADVANCED ROUTES (المعمارية §4)
// ============================================================================
// طبقة النشر لسلسلة الموردين/المشتريات/المبيعات المصغّرة. كل مسار يعبر authz()
// ثم فحص العضوية (ABAC) داخل المضبط، مع سجل تدقيق لكل حدث حساس.

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';
import { isValidUuid } from '../utils/guards';
import {
  createSupplier, listSuppliers, getSupplier, updateSupplier, evaluateSupplier,
} from '../controllers/SupplierController';
import {
  createCustomer, listCustomers, addInteraction,
  createOpportunity, updateOpportunity, listOpportunities,
} from '../controllers/CrmController';
import {
  createPurchaseRequest, submitPurchaseRequest, approvePurchaseRequest,
  createRfq, sendRfq, addRfqOffer, chooseRfqOffer,
  createPurchaseOrder, receivePurchaseOrder, inspectGoodsRequest,
  listPurchaseRequests, listRfqs, listPurchaseOrders,
} from '../controllers/ProcurementController';
import {
  createSalesOrder, verifySalesOrder, fulfillSalesOrder,
  createSalesInvoice, paySalesInvoice, listSalesOrders, listSalesInvoices,
} from '../controllers/SalesController';

const router = Router();

// حارس معرّف المسار: معرّف غير UUID → 404 (لا يصل إلى Prisma)
function validUuidParams(req: Request, res: Response, next: NextFunction) {
  const p = req.params.id ?? req.params.offerId ?? '';
  if (!isValidUuid(p)) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    return;
  }
  next();
}

// ── الموردون ──────────────────────────────────────────────────────────────────
router.post('/suppliers', authenticateToken, authz('supplier:create', { scope: 'org' }), createSupplier);
router.get('/suppliers', authenticateToken, authz('supplier:read', { scope: 'org' }), listSuppliers);
router.get('/suppliers/:id', authenticateToken, authz('supplier:read', { scope: 'org' }), validUuidParams, getSupplier);
router.patch('/suppliers/:id', authenticateToken, authz('supplier:update', { scope: 'org' }), validUuidParams, updateSupplier);
router.post('/suppliers/:id/evaluate', authenticateToken, authz('supplier:evaluate', { scope: 'org' }), validUuidParams, evaluateSupplier);

// ── CRM ───────────────────────────────────────────────────────────────────────
router.post('/crm/customers', authenticateToken, authz('crm:create', { scope: 'org' }), createCustomer);
router.get('/crm/customers', authenticateToken, authz('crm:view', { scope: 'org' }), listCustomers);
router.post('/crm/interactions', authenticateToken, authz('crm:update', { scope: 'org' }), addInteraction);
router.post('/crm/opportunities', authenticateToken, authz('crm:create', { scope: 'org' }), createOpportunity);
router.get('/crm/opportunities', authenticateToken, authz('crm:view', { scope: 'org' }), listOpportunities);
router.patch('/crm/opportunities/:id', authenticateToken, authz('crm:update', { scope: 'org' }), validUuidParams, updateOpportunity);

// ── المشتريات: PR → RFQ → Offers → PO → Receipt ───────────────────────────────
router.post('/procurement/purchase-requests', authenticateToken, authz('purchase:request', { scope: 'org' }), createPurchaseRequest);
router.get('/procurement/purchase-requests', authenticateToken, authz('purchase:request', { scope: 'org' }), listPurchaseRequests);
router.post('/procurement/purchase-requests/:id/submit', authenticateToken, authz('purchase:request', { scope: 'org' }), validUuidParams, submitPurchaseRequest);
router.post('/procurement/purchase-requests/:id/approve', authenticateToken, authz('purchase:approve', { scope: 'org' }), validUuidParams, approvePurchaseRequest);

router.post('/procurement/rfqs', authenticateToken, authz('rfq:create', { scope: 'org' }), createRfq);
router.get('/procurement/rfqs', authenticateToken, authz('rfq:read', { scope: 'org' }), listRfqs);
router.post('/procurement/rfqs/:id/send', authenticateToken, authz('rfq:create', { scope: 'org' }), validUuidParams, sendRfq);
router.post('/procurement/rfqs/:id/offers', authenticateToken, authz('rfq:create', { scope: 'org' }), validUuidParams, addRfqOffer);
router.post('/procurement/rfqs/:id/choose/:offerId', authenticateToken, authz('rfq:choose', { scope: 'org' }), validUuidParams, chooseRfqOffer);

router.post('/procurement/purchase-orders', authenticateToken, authz('purchase:order', { scope: 'org' }), createPurchaseOrder);
router.get('/procurement/purchase-orders', authenticateToken, authz('purchase:read', { scope: 'org' }), listPurchaseOrders);
router.post('/procurement/purchase-orders/:id/receive', authenticateToken, authz('purchase:receive', { scope: 'org' }), validUuidParams, receivePurchaseOrder);
router.post('/procurement/goods-receipts/:id/inspect', authenticateToken, authz('purchase:receive', { scope: 'org' }), validUuidParams, inspectGoodsRequest);

// ── المبيعات: SO → Verify (SoD) → Fulfill → Invoice → Pay ────────────────────
router.post('/sales/orders', authenticateToken, authz('order:create', { scope: 'org' }), createSalesOrder);
router.get('/sales/orders', authenticateToken, authz('order:read', { scope: 'org' }), listSalesOrders);
router.post('/sales/orders/:id/verify', authenticateToken, authz('order:update', { scope: 'org' }), validUuidParams, verifySalesOrder);
router.post('/sales/orders/:id/fulfill', authenticateToken, authz('order:fulfill', { scope: 'org' }), validUuidParams, fulfillSalesOrder);

router.post('/sales/invoices', authenticateToken, authz('finance:invoice:create', { scope: 'org' }), createSalesInvoice);
router.get('/sales/invoices', authenticateToken, authz('finance:invoice:read', { scope: 'org' }), listSalesInvoices);
router.post('/sales/invoices/:id/pay', authenticateToken, authz('finance:invoice:create', { scope: 'org' }), validUuidParams, paySalesInvoice);

export default router;