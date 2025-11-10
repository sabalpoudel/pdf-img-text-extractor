// components/extractor/EnhancedInvoiceMapper.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Download,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface InvoiceFieldMapperProps {
  text: string;
}

interface InvoiceItem {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
  notes: string;
}

interface InvoiceData {
  // Document Info
  documentType: string;
  invoiceNumber: string;
  date: string;

  // Vendor Info
  vendorName: string;
  vendorAddress: string;
  vendorPostalCode: string;
  vendorPhone: string;
  vendorRegistrationNumber: string;
  vendorContact: string;

  // Customer Info
  customerName: string;
  customerAddress: string;
  customerPostalCode: string;

  // Line Items
  items: InvoiceItem[];

  // Totals
  subtotal: string;
  tax: string;
  total: string;

  // Additional
  notes: string;
  paymentTerms: string;
}

export const EnhancedInvoiceMapper = ({ text }: InvoiceFieldMapperProps) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    documentType: "",
    invoiceNumber: "",
    date: "",
    vendorName: "",
    vendorAddress: "",
    vendorPostalCode: "",
    vendorPhone: "",
    vendorRegistrationNumber: "",
    vendorContact: "",
    customerName: "",
    customerAddress: "",
    customerPostalCode: "",
    items: [],
    subtotal: "",
    tax: "",
    total: "",
    notes: "",
    paymentTerms: "",
  });
  const [isExtracting, setIsExtracting] = useState(false);

  const extractInvoiceFields = () => {
    setIsExtracting(true);

    try {
      const extracted: Partial<InvoiceData> = {};
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);

      // Document Type (Japanese & English)
      const docTypeMatch = text.match(
        /^(納品書|請求書|見積書|領収書|Invoice|Delivery Slip|Receipt|Quote)/im
      );
      extracted.documentType = docTypeMatch ? docTypeMatch[1] : "";

      // Invoice/Document Number
      const invoiceNumMatch = text.match(
        /(?:No\.|番号|Invoice\s*#?|Document\s*#?)[\s:]*([A-Z0-9-]+)/i
      );
      extracted.invoiceNumber = invoiceNumMatch ? invoiceNumMatch[1] : "";

      // Date (Japanese & Western formats)
      const dateMatch = text.match(
        /(\d{4}年\d{1,2}月\d{1,2}日|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})/
      );
      extracted.date = dateMatch ? dateMatch[1] : "";

      // Postal Codes
      const postalCodes = text.match(/〒\s*(\d{3}-?\d{4})/g);
      if (postalCodes && postalCodes.length > 0) {
        extracted.vendorPostalCode = postalCodes[0].replace(/〒\s*/, "");
        if (postalCodes.length > 1) {
          extracted.customerPostalCode = postalCodes[1].replace(/〒\s*/, "");
        }
      }

      // Phone Number
      const phoneMatch = text.match(/(?:電話|TEL|Phone)[\s:]*([0-9-]+)/i);
      extracted.vendorPhone = phoneMatch ? phoneMatch[1] : "";

      // Registration Number (Japan Corporate Number)
      const regNumMatch = text.match(
        /(?:登録番号|Registration\s*Number)[\s:]*([T0-9]+)/i
      );
      extracted.vendorRegistrationNumber = regNumMatch ? regNumMatch[1] : "";

      // Contact Person
      const contactMatch = text.match(/(?:担当|Contact)[\s:]*([^\n]+)/i);
      extracted.vendorContact = contactMatch ? contactMatch[1].trim() : "";

      // Company Names (looking for 株式会社, Co., Ltd., etc.)
      const companyPattern =
        /([^\n]*(?:株式会社|有限会社|合同会社|Co\.|Ltd\.|Inc\.|Corp\.|LLC)[^\n]*)/gi;
      const companies = text.match(companyPattern);
      if (companies && companies.length > 0) {
        extracted.vendorName = companies[0].trim();
        if (companies.length > 1) {
          extracted.customerName = companies[1].trim();
        }
      }

      // Extract customer name if it has 御中 (honorific)
      const customerMatch = text.match(/([^\n]+御中)/);
      if (customerMatch) {
        extracted.customerName = customerMatch[1].trim();
      }

      // Addresses (multi-line Japanese addresses)
      const addressPattern =
        /(?:〒\s*\d{3}-?\d{4}\s*)([^\n]+(?:都|道|府|県)[^\n]+)/g;
      const addresses = [...text.matchAll(addressPattern)];
      if (addresses.length > 0) {
        extracted.vendorAddress = addresses[0][1].trim();
        if (addresses.length > 1) {
          extracted.customerAddress = addresses[1][1].trim();
        }
      }

      // Extract Line Items
      const items: InvoiceItem[] = [];
      const itemSectionMatch = text.match(
        /品名[^\n]*\n([\s\S]*?)(?=金額|小計|合計|Page|\n\n|$)/i
      );

      if (itemSectionMatch) {
        const itemLines = itemSectionMatch[1]
          .split("\n")
          .filter((l) => l.trim());

        itemLines.forEach((line) => {
          // Match Japanese invoice line format
          const itemMatch = line.match(
            /^([^\d¥]+?)\s+(\d+)\s+([^\d¥]+?)\s+¥?([\d,]+)\s+¥?([\d,]+)\s*(.*)?$/
          );
          if (itemMatch) {
            items.push({
              description: itemMatch[1].trim(),
              quantity: itemMatch[2].trim(),
              unit: itemMatch[3].trim(),
              unitPrice: itemMatch[4].trim(),
              amount: itemMatch[5].trim(),
              notes: itemMatch[6] ? itemMatch[6].trim() : "",
            });
          }
        });
      }
      extracted.items = items;

      // Subtotal
      const subtotalMatch = text.match(
        /(?:金額|小計|Subtotal)[\s:]*¥?([\d,]+)/i
      );
      extracted.subtotal = subtotalMatch ? subtotalMatch[1] : "";

      // Tax
      const taxMatch = text.match(/(?:消費税|税|Tax|VAT)[\s:]*¥?([\d,]+)/i);
      extracted.tax = taxMatch ? taxMatch[1] : "";

      // Total
      const totalMatch = text.match(
        /(?:合計|総額|Total)(?:\(税込\))?[\s:]*¥?([\d,]+)/i
      );
      extracted.total = totalMatch ? totalMatch[1] : "";

      setInvoiceData((prev) => ({ ...prev, ...extracted }));
    } catch (error) {
      console.error("Extraction error:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFieldChange = (field: keyof InvoiceData, value: string) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string
  ) => {
    const newItems = [...invoiceData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: "",
          unit: "",
          unitPrice: "",
          amount: "",
          notes: "",
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(invoiceData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoiceData.invoiceNumber || "data"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAsJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(invoiceData, null, 2));
    alert("Invoice data copied as JSON!");
  };

  const resetFields = () => {
    setInvoiceData({
      documentType: "",
      invoiceNumber: "",
      date: "",
      vendorName: "",
      vendorAddress: "",
      vendorPostalCode: "",
      vendorPhone: "",
      vendorRegistrationNumber: "",
      vendorContact: "",
      customerName: "",
      customerAddress: "",
      customerPostalCode: "",
      items: [],
      subtotal: "",
      tax: "",
      total: "",
      notes: "",
      paymentTerms: "",
    });
  };

  if (!text) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          Invoice Data Extraction
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={extractInvoiceFields}
            disabled={isExtracting}
            size="sm"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {isExtracting ? "Extracting..." : "Auto-Extract"}
          </Button>
          <Button onClick={resetFields} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-4">
        {/* Document Info */}
        <div>
          <h3 className="font-semibold text-sm mb-2 text-green-800">
            Document Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Document Type
              </label>
              <input
                type="text"
                value={invoiceData.documentType}
                onChange={(e) =>
                  handleFieldChange("documentType", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="Invoice/納品書"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceData.invoiceNumber}
                onChange={(e) =>
                  handleFieldChange("invoiceNumber", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="00000051"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Date</label>
              <input
                type="text"
                value={invoiceData.date}
                onChange={(e) => handleFieldChange("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="2025-08-28"
              />
            </div>
          </div>
        </div>

        {/* Vendor Info */}
        <div>
          <h3 className="font-semibold text-sm mb-2 text-green-800">
            Vendor Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Vendor Name
              </label>
              <input
                type="text"
                value={invoiceData.vendorName}
                onChange={(e) =>
                  handleFieldChange("vendorName", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                value={invoiceData.vendorPostalCode}
                onChange={(e) =>
                  handleFieldChange("vendorPostalCode", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={invoiceData.vendorAddress}
                onChange={(e) =>
                  handleFieldChange("vendorAddress", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Phone</label>
              <input
                type="text"
                value={invoiceData.vendorPhone}
                onChange={(e) =>
                  handleFieldChange("vendorPhone", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Registration Number
              </label>
              <input
                type="text"
                value={invoiceData.vendorRegistrationNumber}
                onChange={(e) =>
                  handleFieldChange("vendorRegistrationNumber", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div>
          <h3 className="font-semibold text-sm mb-2 text-green-800">
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Customer Name
              </label>
              <input
                type="text"
                value={invoiceData.customerName}
                onChange={(e) =>
                  handleFieldChange("customerName", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                value={invoiceData.customerPostalCode}
                onChange={(e) =>
                  handleFieldChange("customerPostalCode", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={invoiceData.customerAddress}
                onChange={(e) =>
                  handleFieldChange("customerAddress", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-green-800">Line Items</h3>
            <Button
              onClick={addItem}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              + Add Item
            </Button>
          </div>
          <div className="space-y-2">
            {invoiceData.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-lg border space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">
                    Item {idx + 1}
                  </span>
                  <Button
                    onClick={() => removeItem(idx)}
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(idx, "description", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Description"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, "quantity", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Qty"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) =>
                        handleItemChange(idx, "unit", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Unit"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(idx, "unitPrice", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Unit Price"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.amount}
                      onChange={(e) =>
                        handleItemChange(idx, "amount", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Amount"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div>
          <h3 className="font-semibold text-sm mb-2 text-green-800">Totals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Subtotal
              </label>
              <input
                type="text"
                value={invoiceData.subtotal}
                onChange={(e) => handleFieldChange("subtotal", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="¥2,507,000"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Tax</label>
              <input
                type="text"
                value={invoiceData.tax}
                onChange={(e) => handleFieldChange("tax", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="¥250,700"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Total</label>
              <input
                type="text"
                value={invoiceData.total}
                onChange={(e) => handleFieldChange("total", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500 font-semibold"
                placeholder="¥2,757,700"
              />
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={copyAsJSON}
            className="flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToJSON}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Smart Extraction Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>
            Supports Japanese invoices (納品書, 請求書) and English formats
          </li>
          <li>
            Automatically detects: vendor, customer, items, totals, addresses
          </li>
          <li>Manually edit any field to correct extraction errors</li>
          <li>
            Export structured JSON for API integration or database storage
          </li>
        </ul>
      </div>
    </div>
  );
};
