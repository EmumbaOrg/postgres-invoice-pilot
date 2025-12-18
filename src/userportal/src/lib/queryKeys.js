/**
 * Query Keys Factory
 * 
 * This factory provides a centralized way to manage query keys
 * Benefits:
 * 1. Type-safe and consistent query keys across the app
 * 2. Easy to invalidate related queries
 * 3. Better organization and discoverability
 * 4. Prevents typos and key conflicts
 */

export const queryKeys = {
  // Status
  status: {
    all: ['status'],
    detail: () => [...queryKeys.status.all, 'detail'],
  },

  // Vendors
  vendors: {
    all: ['vendors'],
    lists: () => [...queryKeys.vendors.all, 'list'],
    list: (filters) => [...queryKeys.vendors.lists(), filters],
    details: () => [...queryKeys.vendors.all, 'detail'],
    detail: (id) => [...queryKeys.vendors.details(), id],
  },

  // Invoices
  invoices: {
    all: ['invoices'],
    lists: () => [...queryKeys.invoices.all, 'list'],
    list: (filters) => [...queryKeys.invoices.lists(), filters],
    details: () => [...queryKeys.invoices.all, 'detail'],
    detail: (id) => [...queryKeys.invoices.details(), id],
  },

  // Invoice Line Items
  invoiceLineItems: {
    all: ['invoiceLineItems'],
    lists: () => [...queryKeys.invoiceLineItems.all, 'list'],
    list: (filters) => [...queryKeys.invoiceLineItems.lists(), filters],
    details: () => [...queryKeys.invoiceLineItems.all, 'detail'],
    detail: (id) => [...queryKeys.invoiceLineItems.details(), id],
    milestones: (invoiceId) => [...queryKeys.invoiceLineItems.all, 'milestones', invoiceId],
  },

  // SOWs (Statement of Work)
  sows: {
    all: ['sows'],
    lists: () => [...queryKeys.sows.all, 'list'],
    list: (filters) => [...queryKeys.sows.lists(), filters],
    details: () => [...queryKeys.sows.all, 'detail'],
    detail: (id) => [...queryKeys.sows.details(), id],
    chunks: (id) => [...queryKeys.sows.detail(id), 'chunks'],
  },

  // Milestones
  milestones: {
    all: ['milestones'],
    lists: () => [...queryKeys.milestones.all, 'list'],
    list: (filters) => [...queryKeys.milestones.lists(), filters],
    details: () => [...queryKeys.milestones.all, 'detail'],
    detail: (id) => [...queryKeys.milestones.details(), id],
  },

  // Deliverables
  deliverables: {
    all: ['deliverables'],
    lists: () => [...queryKeys.deliverables.all, 'list'],
    list: (filters) => [...queryKeys.deliverables.lists(), filters],
    details: () => [...queryKeys.deliverables.all, 'detail'],
    detail: (id) => [...queryKeys.deliverables.details(), id],
  },

  // Documents
  documents: {
    all: ['documents'],
    lists: () => [...queryKeys.documents.all, 'list'],
    list: (filters) => [...queryKeys.documents.lists(), filters],
    recent: (sortBy) => [...queryKeys.documents.all, 'recent', sortBy],
  },

  // Activities
  activities: {
    all: ['activities'],
    recent: (limit) => [...queryKeys.activities.all, 'recent', limit],
  },

  // Statuses
  statuses: {
    all: ['statuses'],
    list: () => [...queryKeys.statuses.all, 'list'],
  },

  // Validation Results
  validationResults: {
    all: ['validationResults'],
    invoice: (id) => [...queryKeys.validationResults.all, 'invoice', id],
    sow: (id) => [...queryKeys.validationResults.all, 'sow', id],
  },

  // Completions (Chat)
  completions: {
    all: ['completions'],
    sessions: () => [...queryKeys.completions.all, 'sessions'],
    history: (sessionId) => [...queryKeys.completions.all, 'history', sessionId],
  },
};

