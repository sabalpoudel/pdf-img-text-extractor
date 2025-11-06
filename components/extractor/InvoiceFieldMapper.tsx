// components/extractor/InvoiceFieldMapper.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileSpreadsheet, Sparkles } from "lucide-react";

interface InvoiceFieldMapperProps {
  text: string;
}

interface InvoiceFields {
  invoiceNumber: string;
  date: string;
  vendor: string;
  customer: string;
  totalAmount: string;
  subtotal: string;
  tax: string;
  items: string;
  address: string;
  [key: string]: string;
}

export const InvoiceFieldMapper = ({ text }: InvoiceFieldMapperProps) => {
  const [fields, setFields] = useState<InvoiceFields>({
    invoiceNumber: "",
    date: "",
    vendor: "",
    customer: "",
    totalAmount: "",
    subtotal: "",
    tax: "",
    items: "",
    address: "",
  });
  const [isExtracting, setIsExtracting] = useState(false);

  const extractInvoiceFields = () => {
    setIsExtracting(true);

    // Simple pattern matching for common invoice fields
    const patterns = {
      invoiceNumber: /(?:invoice|inv|#)\s*(?:no|number|#)?[\s:]*([A-Z0-9-]+)/i,
      date: /(?:date|dated|issued)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
      vendor: /(?:from|vendor|seller|company)[\s:]*([^\n]+)/i,
      customer: /(?:to|customer|buyer|bill to)[\s:]*([^\n]+)/i,
      totalAmount:
        /(?:total|amount due|grand total|balance)[\s:]*(?:\$|¥|€|£)?\s*([\d,]+\.?\d*)/i,
      subtotal: /(?:subtotal|sub total)[\s:]*(?:\$|¥|€|£)?\s*([\d,]+\.?\d*)/i,
      tax: /(?:tax|vat|gst)[\s:]*(?:\$|¥|€|£)?\s*([\d,]+\.?\d*)/i,
    };

    const extracted: Partial<InvoiceFields> = {};

    for (const [field, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        extracted[field] = match[1]?.trim() || "";
      }
    }

    // Extract items (lines between common markers)
    const itemsMatch = text.match(
      /(?:description|item|product)[\s\S]*?(?=total|subtotal|$)/i
    );
    if (itemsMatch) {
      extracted.items = itemsMatch[0].trim();
    }

    setFields((prev) => ({ ...prev, ...extracted } as any));
    setIsExtracting(false);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFields((prev) => ({ ...prev, [fieldName]: value }));
  };

  const exportToCSV = () => {
    const csv = Object.entries(fields)
      .map(([key, value]) => `"${key}","${value.replace(/"/g, '""')}"`)
      .join("\n");

    const blob = new Blob([`Field,Value\n${csv}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice-fields.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyFieldsAsJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(fields, null, 2));
    alert("Invoice fields copied as JSON!");
  };

  if (!text) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          Invoice Field Mapping
        </h2>
        <Button
          onClick={extractInvoiceFields}
          disabled={isExtracting}
          size="sm"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Auto-Extract Fields
        </Button>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(fields).map(([fieldName, value]) => (
            <div key={fieldName} className="space-y-1">
              <label className="text-xs font-medium text-gray-700 capitalize">
                {fieldName.replace(/([A-Z])/g, " $1").trim()}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={`Enter ${fieldName}`}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyFieldsAsJSON}
            className="flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>
            Click "Auto-Extract Fields" to automatically detect invoice data
          </li>
          <li>Manually edit any field to correct extraction errors</li>
          <li>
            Export to CSV for spreadsheet import or copy as JSON for API usage
          </li>
        </ul>
      </div>
    </div>
  );
};
