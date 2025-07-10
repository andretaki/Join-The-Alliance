// Re-export everything from the employee schema
export * from './employee-schema';

// Placeholder schemas for compatibility with existing API routes
// These can be removed once the API routes are updated to use employee schemas only
import { pgTable, serial, text, timestamp, boolean, decimal } from 'drizzle-orm/pg-core';

export const customerApplications = pgTable('customer_applications', {
  id: serial('id').primaryKey(),
  legalEntityName: text('legal_entity_name'),
  dba: text('dba'),
  taxEIN: text('tax_ein'),
  dunsNumber: text('duns_number'),
  companyName: text('company_name'),
  email: text('email'),
  phone: text('phone'),
  fax: text('fax'),
  website: text('website'),
  businessType: text('business_type'),
  yearEstablished: text('year_established'),
  numberOfEmployees: text('number_of_employees'),
  annualRevenue: text('annual_revenue'),
  creditRequested: decimal('credit_requested'),
  paymentTerms: text('payment_terms'),
  primaryContact: text('primary_contact'),
  accountingContact: text('accounting_contact'),
  mailingAddress: text('mailing_address'),
  shippingAddress: text('shipping_address'),
  billingAddress: text('billing_address'),
  bankName: text('bank_name'),
  bankAddress: text('bank_address'),
  accountNumber: text('account_number'),
  routingNumber: text('routing_number'),
  status: text('status').default('pending'),
  signatureDataUrl: text('signature_data_url'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  submissionId: text('submission_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const creditApprovals = pgTable('credit_approvals', {
  id: serial('id').primaryKey(),
  applicationId: serial('application_id'),
  decision: text('decision'),
  amount: decimal('amount'),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const digitalSignatures = pgTable('digital_signatures', {
  id: serial('id').primaryKey(),
  applicationId: serial('application_id'),
  signatureDataUrl: text('signature_data_url'),
  signedAt: timestamp('signed_at').defaultNow().notNull(),
});

export const tradeReferences = pgTable('trade_references', {
  id: serial('id').primaryKey(),
  applicationId: serial('application_id'),
  companyName: text('company_name'),
  contactName: text('contact_name'),
  phone: text('phone'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const vendorForms = pgTable('vendor_forms', {
  id: serial('id').primaryKey(),
  companyName: text('company_name'),
  contactEmail: text('contact_email'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});