// User Roles
export type Role = 'admin' | 'storekeeper' | 'hod' | 'accounts';

// User Interface
export interface User {
  _id?: string;
  name: string;
  email: string;
  hash: string;
  role: Role;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Item Interface
export interface Item {
  _id?: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  description?: string;
  minStock: number;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

// Item Batch Interface
export interface ItemBatch {
  _id?: string;
  itemId: string;
  batchNumber: string;
  locationId: string;
  purchasePrice: number;
  expiryDate?: Date;
  totalQty: number;
  availableQty: number;
  reservedQty: number;
  grnId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Stock Ledger Entry
export interface StockLedger {
  _id?: string;
  itemId: string;
  batchId?: string;
  transactionType: 'IN' | 'OUT' | 'ADJUST' | 'RETURN' | 'CONSUMPTION';
  quantity: number;
  unitPrice: number;
  locationId: string;
  referenceId?: string; // PR, PO, GRN, Issue, Return ID
  referenceType?: string;
  userId: string;
  notes?: string;
  createdAt: Date;
}

// Purchase Requisition
export interface PurchaseRequisition {
  _id?: string;
  prNumber: string;
  requestedBy: string;
  departmentId: string;
  items: PRItem[];
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PRItem {
  itemId: string;
  quantity: number;
  unit: string;
  purpose: string;
  priority: 'low' | 'medium' | 'high';
}

// Purchase Order
export interface PurchaseOrder {
  _id?: string;
  poNumber: string;
  prId?: string;
  supplierId: string;
  items: POItem[];
  status: 'draft' | 'approved' | 'sent' | 'partial' | 'completed' | 'cancelled';
  totalAmount: number;
  currency: string;
  expectedDeliveryDate?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  sentAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface POItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  totalPrice: number;
}

// GRN (Goods Receipt Note)
export interface GRN {
  _id?: string;
  grnNumber: string;
  poId: string;
  supplierId: string;
  receivedBy: string;
  items: GRNItem[];
  status: 'draft' | 'completed';
  totalAmount: number;
  receivedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GRNItem {
  itemId: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  expiryDate?: Date;
  locationId: string;
}

// Issue Request
export interface IssueRequest {
  _id?: string;
  issueNumber: string;
  requestedBy: string;
  departmentId: string;
  items: IssueItem[];
  status: 'pending' | 'approved' | 'rejected' | 'issued';
  approvedBy?: string;
  approvedAt?: Date;
  issuedBy?: string;
  issuedAt?: Date;
  rejectionReason?: string;
  purpose: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueItem {
  itemId: string;
  quantity: number;
  unit: string;
}

// Return
export interface Return {
  _id?: string;
  returnNumber: string;
  issueId?: string;
  returnedBy: string;
  departmentId: string;
  items: ReturnItem[];
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnItem {
  itemId: string;
  batchId: string;
  quantity: number;
  unit: string;
}

// Consumption Log
export interface ConsumptionLog {
  _id?: string;
  itemId: string;
  batchId: string;
  departmentId: string;
  theoreticalQty: number;
  actualQty: number;
  variance: number;
  consumedBy: string;
  consumedAt: Date;
  notes?: string;
  createdAt: Date;
}

// Supplier
export interface Supplier {
  _id?: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Department
export interface Department {
  _id?: string;
  name: string;
  code: string;
  hodId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Location
export interface Location {
  _id?: string;
  name: string;
  code: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Log
export interface AuditLog {
  _id?: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Reports Cache
export interface ReportsCache {
  _id?: string;
  reportType: string;
  parameters: Record<string, any>;
  data: any;
  generatedAt: Date;
  expiresAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
export interface AuthenticatedRequest {
  user?: User;
}

