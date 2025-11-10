// types/document.ts

export interface DocumentItem {
  product_name: string;
  unit: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  tax_rate: string;
  tax_amount: string;
  remarks: string;
  // Additional fields for specific document types
  sales_amount?: string; // for invoices
  sales_date?: string; // for invoices
  product_code?: string; // for orders
  product_id?: string; // for orders
}

export interface DocumentDetails {
  delivery_date?: string;
  delivery_place?: string;
  payment_terms?: string;
  notes?: string;
}

export interface UniversalDocument {
  // Document Identification
  document_type: "delivery" | "invoice" | "order" | "quotation";
  document_number: string;
  version?: string; // for quotations

  // Company/Vendor Information
  company_id?: string;
  company_name: string;
  company_address: string;
  company_postal_code: string;
  company_phone: string;
  company_registration_number: string;
  company_contact?: string;

  // Client/Customer Information
  client_id?: string;
  client_name: string;
  client_address: string;
  client_postal_code: string;

  // Dates
  issue_date: string; // or quotation_date, order_date, delivery_date
  expiry_date?: string; // for quotations
  closing_date?: string; // for invoices
  collection_date?: string; // for invoices

  // Line Items
  items: DocumentItem[];

  // Financial Totals
  total_amount: string; // subtotal excluding tax
  total_tax: string; // total tax amount
  grand_total: string; // total including tax

  // Tax Configuration
  consumption_tax_display: number; // 0: exclude, 1: include
  fraction_calculation: number; // 0: round down, 1: round up, 2: round off

  // Additional Details
  details?: DocumentDetails;
  subject?: string; // for quotations
  remarks?: string;
  special_notes?: string;

  // Bank Information (for invoices)
  bank_name?: string;
  bank_branch_name?: string;
  bank_account_name?: string;
  bank_account_type?: number;
  bank_account_number?: string;

  // Status Information
  status?: number;
  approval_status?: number;

  // Additional metadata
  raw_text?: string; // original OCR text for reference
}

// Export schema for Laravel backend
export interface LaravelDelivery {
  company_id?: string;
  client_id?: string;
  total_amount: string;
  total_tax: string;
  consumption_tax_display: number;
  fraction_calculation: number;
  delivery_date: string;
  remarks?: string;
  items: Array<{
    product_name: string;
    unit_price: string;
    unit: string;
    quantity: string;
    total_price: string;
    tax_rate: string;
    tax_amount: string;
    remarks?: string;
  }>;
}

export interface LaravelInvoice {
  company_id?: string;
  client_id?: string;
  client_name: string;
  issue_date: string;
  closing_date?: string;
  collection_date?: string;
  consumption_tax_display: number;
  fraction_calculation: number;
  purchase_amount: string;
  consumption_tax_amount: string;
  total_purchase: string;
  amount_billed: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_branch_name?: string;
  bank_account_type?: number;
  bank_account_number?: string;
  items: Array<{
    product_name: string;
    unit: string;
    quantity: string;
    unit_price: string;
    sales_amount: string;
    tax_rate: string;
    tax_amount: string;
    remarks?: string;
    sales_date?: string;
  }>;
}

export interface LaravelOrder {
  company_id?: string;
  client_id?: string;
  special_notes?: string;
  total_amount: string;
  total_tax: string;
  grand_total: string;
  consumption_tax_display: number;
  fraction_calculation: number;
  order_date: string;
  items: Array<{
    product_name: string;
    product_code?: string;
    unit: string;
    quantity: string;
    unit_price: string;
    total_price: string;
    tax_rate: string;
    tax_amount: string;
    remarks?: string;
  }>;
  details?: {
    delivery_date?: string;
    delivery_place?: string;
    payment_terms?: string;
    notes?: string;
  };
}

export interface LaravelQuotation {
  company_id?: string;
  client_id?: string;
  quotation_number: string;
  version?: string;
  total_amount: string;
  total_tax: string;
  consumption_tax_display: number;
  fraction_calculation: number;
  quotation_date: string;
  expiry_date?: string;
  subject?: string;
  remarks?: string;
  special_notes?: string;
  items: Array<{
    product_name: string;
    unit: string;
    quantity: string;
    unit_price: string;
    sales_amount: string;
    tax_rate: string;
    tax_amount: string;
    remarks?: string;
  }>;
  details?: {
    delivery_date?: string;
    delivery_place?: string;
    payment_terms?: string;
    notes?: string;
  };
}
