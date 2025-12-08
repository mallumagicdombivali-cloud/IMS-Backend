import { z } from 'zod';

// User validations
export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'storekeeper', 'hod', 'accounts']),
  departmentId: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'storekeeper', 'hod', 'accounts']).optional(),
  departmentId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Item validations
export const createItemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  description: z.string().optional(),
  minStock: z.number().min(0),
  reorderLevel: z.number().min(0),
});

export const updateItemSchema = createItemSchema.partial();

// PR validations
export const createPRSchema = z.object({
  departmentId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().positive(),
      unit: z.string(),
      purpose: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
    })
  ),
});

export const approvePRSchema = z.object({
  rejectionReason: z.string().optional(),
});

// PO validations
export const createPOSchema = z.object({
  prId: z.string().optional(),
  supplierId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      unit: z.string(),
    })
  ),
  expectedDeliveryDate: z.string().datetime().optional(),
});

export const approvePOSchema = z.object({
  cancellationReason: z.string().optional(),
});

// GRN validations
export const createGRNSchema = z.object({
  poId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      batchNumber: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      expiryDate: z.string().datetime().optional(),
      locationId: z.string(),
    })
  ),
  notes: z.string().optional(),
});

// Issue Request validations
export const createIssueSchema = z.object({
  departmentId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().positive(),
      unit: z.string(),
    })
  ),
  purpose: z.string(),
});

export const approveIssueSchema = z.object({
  rejectionReason: z.string().optional(),
});

// Return validations
export const createReturnSchema = z.object({
  issueId: z.string().optional(),
  departmentId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      batchId: z.string(),
      quantity: z.number().positive(),
      unit: z.string(),
    })
  ),
  reason: z.string(),
});

// Consumption validations
export const createConsumptionSchema = z.object({
  itemId: z.string(),
  batchId: z.string(),
  departmentId: z.string(),
  theoreticalQty: z.number().positive(),
  actualQty: z.number().min(0),
  notes: z.string().optional(),
});

// Supplier validations
export const createSupplierSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  taxId: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
});

// Department validations
export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  hodId: z.string().optional(),
});

// Location validations
export const createLocationSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
});

// Stock adjustment validations
export const stockAdjustSchema = z.object({
  itemId: z.string(),
  batchId: z.string().optional(),
  locationId: z.string(),
  quantity: z.number(),
  reason: z.string(),
  notes: z.string().optional(),
});

