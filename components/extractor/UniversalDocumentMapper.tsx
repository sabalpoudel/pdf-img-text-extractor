// components/extractor/UniversalDocumentMapper.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Download,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  Database,
} from "lucide-react";
import {
  UniversalDocument,
  DocumentItem,
  LaravelDelivery,
  LaravelInvoice,
  LaravelOrder,
  LaravelQuotation,
} from "@/types/document";

interface UniversalDocumentMapperProps {
  text: string;
}

export const UniversalDocumentMapper = ({
  text,
}: UniversalDocumentMapperProps) => {
  const [document, setDocument] = useState<UniversalDocument>({
    document_type: "delivery",
    document_number: "",
    company_name: "",
    company_address: "",
    company_postal_code: "",
    company_phone: "",
    company_registration_number: "",
    client_name: "",
    client_address: "",
    client_postal_code: "",
    issue_date: "",
    items: [],
    total_amount: "",
    total_tax: "",
    grand_total: "",
    consumption_tax_display: 0,
    fraction_calculation: 2,
  });
  const [isExtracting, setIsExtracting] = useState(false);

  const detectDocumentType = (
    text: string
  ): UniversalDocument["document_type"] => {
    if (text.match(/納品書|delivery\s*slip/i)) return "delivery";
    if (text.match(/請求書|invoice/i)) return "invoice";
    if (text.match(/注文書|purchase\s*order|order/i)) return "order";
    if (text.match(/見積書|quotation|quote|estimate/i)) return "quotation";
    return "delivery";
  };

  const extractDocumentFields = () => {
    setIsExtracting(true);

    try {
      const extracted: Partial<UniversalDocument> = {};
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);

      // Detect document type
      extracted.document_type = detectDocumentType(text);

      // Document Number
      const docNumMatch = text.match(
        /(?:No\.|番号|#|注文番号|見積番号|請求書番号)[\s:]*([A-Z0-9-]+)/i
      );
      extracted.document_number = docNumMatch ? docNumMatch[1] : "";

      // Version (for quotations)
      const versionMatch = text.match(/(?:version|ver|版)[\s:]*([0-9.]+)/i);
      extracted.version = versionMatch ? versionMatch[1] : undefined;

      // Date (issue date, quotation date, order date, delivery date)
      const dateMatch = text.match(
        /(\d{4}年\d{1,2}月\d{1,2}日|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})/
      );
      extracted.issue_date = dateMatch ? dateMatch[1] : "";

      // Expiry date (for quotations)
      const expiryMatch = text.match(
        /(?:有効期限|expiry|valid\s*until)[\s:]*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日)/i
      );
      extracted.expiry_date = expiryMatch ? expiryMatch[1] : undefined;

      // Postal Codes
      const postalCodes = text.match(/〒\s*(\d{3}-?\d{4})/g);
      if (postalCodes && postalCodes.length > 0) {
        extracted.company_postal_code = postalCodes[0].replace(/〒\s*/, "");
        if (postalCodes.length > 1) {
          extracted.client_postal_code = postalCodes[1].replace(/〒\s*/, "");
        }
      }

      // Phone Number
      const phoneMatch = text.match(/(?:電話|TEL|Phone)[\s:]*([0-9-]+)/i);
      extracted.company_phone = phoneMatch ? phoneMatch[1] : "";

      // Registration Number (Japan Corporate Number)
      const regNumMatch = text.match(
        /(?:登録番号|Registration\s*Number)[\s:]*([T0-9]+)/i
      );
      extracted.company_registration_number = regNumMatch ? regNumMatch[1] : "";

      // Company Names
      const companyPattern =
        /([^\n]*(?:株式会社|有限会社|合同会社|Co\.|Ltd\.|Inc\.|Corp\.|LLC)[^\n]*)/gi;
      const companies = text.match(companyPattern);
      if (companies && companies.length > 0) {
        extracted.company_name = companies[0].trim();
        if (companies.length > 1) {
          extracted.client_name = companies[1].trim();
        }
      }

      // Client name with 御中
      const customerMatch = text.match(/([^\n]+御中)/);
      if (customerMatch) {
        extracted.client_name = customerMatch[1].replace("御中", "").trim();
      }

      // Addresses
      const addressPattern =
        /(?:〒\s*\d{3}-?\d{4}\s*)([^\n]+(?:都|道|府|県)[^\n]+)/g;
      const addresses = [...text.matchAll(addressPattern)];
      if (addresses.length > 0) {
        extracted.company_address = addresses[0][1].trim();
        if (addresses.length > 1) {
          extracted.client_address = addresses[1][1].trim();
        }
      }

      // Bank Information (for invoices)
      const bankNameMatch = text.match(/(?:銀行|Bank)[\s:]*([^\n]+)/i);
      if (bankNameMatch) extracted.bank_name = bankNameMatch[1].trim();

      const bankBranchMatch = text.match(/(?:支店|Branch)[\s:]*([^\n]+)/i);
      if (bankBranchMatch)
        extracted.bank_branch_name = bankBranchMatch[1].trim();

      const accountNameMatch = text.match(
        /(?:口座名義|Account\s*Name)[\s:]*([^\n]+)/i
      );
      if (accountNameMatch)
        extracted.bank_account_name = accountNameMatch[1].trim();

      const accountNumMatch = text.match(
        /(?:口座番号|Account\s*Number)[\s:]*([0-9]+)/i
      );
      if (accountNumMatch) extracted.bank_account_number = accountNumMatch[1];

      // Account type (普通 = 1, 当座 = 2)
      if (text.match(/普通/)) extracted.bank_account_type = 1;
      if (text.match(/当座/)) extracted.bank_account_type = 2;

      // Subject (for quotations)
      const subjectMatch = text.match(/(?:件名|subject)[\s:]*([^\n]+)/i);
      if (subjectMatch) extracted.subject = subjectMatch[1].trim();

      // Payment terms
      const paymentMatch = text.match(
        /(?:支払条件|payment\s*terms)[\s:]*([^\n]+)/i
      );
      if (paymentMatch) {
        extracted.details = {
          ...extracted.details,
          payment_terms: paymentMatch[1].trim(),
        };
      }

      // Delivery date
      const deliveryDateMatch = text.match(
        /(?:納期|delivery\s*date)[\s:]*([^\n]+)/i
      );
      if (deliveryDateMatch) {
        extracted.details = {
          ...extracted.details,
          delivery_date: deliveryDateMatch[1].trim(),
        };
      }

      // Delivery place
      const deliveryPlaceMatch = text.match(
        /(?:納入場所|delivery\s*place)[\s:]*([^\n]+)/i
      );
      if (deliveryPlaceMatch) {
        extracted.details = {
          ...extracted.details,
          delivery_place: deliveryPlaceMatch[1].trim(),
        };
      }

      // Extract Line Items
      const items: DocumentItem[] = [];
      const itemSectionMatch = text.match(
        /(?:品名|商品名|Product|Item|Description)[^\n]*\n([\s\S]*?)(?=金額|小計|合計|Page|備考欄|\n\n|$)/i
      );

      if (itemSectionMatch) {
        const itemLines = itemSectionMatch[1]
          .split("\n")
          .filter((l) => l.trim());

        itemLines.forEach((line) => {
          // Skip header lines
          if (
            line.match(
              /品名|商品名|Product|Description|数量|Quantity|単価|Price|金額|Amount/i
            )
          ) {
            return;
          }

          // Pattern for Japanese invoice lines - more flexible
          const patterns = [
            // Pattern 1: Name Qty Unit UnitPrice TotalPrice [Notes]
            /^([^\d¥]+?)\s+(\d+(?:\.\d+)?)\s+([^\d¥]+?)\s+¥?([\d,]+(?:\.\d+)?)\s+¥?([\d,]+(?:\.\d+)?)\s*(.*)?$/,
            // Pattern 2: Name Unit Qty UnitPrice TotalPrice [Notes]
            /^([^\d¥]+?)\s+([^\d¥]+?)\s+(\d+(?:\.\d+)?)\s+¥?([\d,]+(?:\.\d+)?)\s+¥?([\d,]+(?:\.\d+)?)\s*(.*)?$/,
            // Pattern 3: More flexible - capture any sequence
            /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\S+)\s+¥?([\d,]+(?:\.\d+)?)\s+¥?([\d,]+(?:\.\d+)?)\s*(.*)?$/,
          ];

          for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            const match = line.match(pattern);
            if (match) {
              let productName, quantity, unit, unitPrice, totalPrice, remarks;

              if (i === 1) {
                // Pattern 2: Name Unit Qty UnitPrice TotalPrice
                productName = match[1].trim();
                unit = match[2].trim();
                quantity = match[3].trim();
                unitPrice = match[4].trim();
                totalPrice = match[5].trim();
                remarks = match[6] ? match[6].trim() : "";
              } else {
                // Pattern 1 & 3: Name Qty Unit UnitPrice TotalPrice
                productName = match[1].trim();
                quantity = match[2].trim();
                unit = match[3].trim();
                unitPrice = match[4].trim();
                totalPrice = match[5].trim();
                remarks = match[6] ? match[6].trim() : "";
              }

              // Calculate tax (assuming 10% if not specified)
              const totalPriceNum = parseFloat(totalPrice.replace(/,/g, ""));
              const taxRate = "10";
              const taxAmount = Math.round(totalPriceNum * 0.1).toString();

              items.push({
                product_name: productName,
                quantity: quantity,
                unit: unit,
                unit_price: unitPrice,
                total_price: totalPrice,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                remarks: remarks,
                sales_amount: totalPrice, // For invoices/quotations
              });
              break;
            }
          }
        });
      }
      extracted.items = items;

      // Subtotal (excluding tax)
      const subtotalMatch = text.match(
        /(?:金額|小計|Subtotal)[\s:]*¥?([\d,]+)/i
      );
      extracted.total_amount = subtotalMatch ? subtotalMatch[1] : "";

      // Tax
      const taxMatch = text.match(/(?:消費税|税|Tax|VAT)[\s:]*¥?([\d,]+)/i);
      extracted.total_tax = taxMatch ? taxMatch[1] : "";

      // Grand Total
      const totalMatch = text.match(
        /(?:合計|総額|Total)(?:\(税込\))?[\s:]*¥?([\d,]+)/i
      );
      extracted.grand_total = totalMatch ? totalMatch[1] : "";

      // Tax display (detect 外税 = 0, 内税 = 1)
      if (text.match(/外税/)) extracted.consumption_tax_display = 0;
      if (text.match(/内税|税込/)) extracted.consumption_tax_display = 1;

      // Fraction calculation (切り捨て = 0, 切り上げ = 1, 四捨五入 = 2)
      if (text.match(/切り捨て/)) extracted.fraction_calculation = 0;
      if (text.match(/切り上げ/)) extracted.fraction_calculation = 1;
      if (text.match(/四捨五入/)) extracted.fraction_calculation = 2;

      // Remarks
      const remarksMatch = text.match(/(?:備考|remarks|notes)[\s:]*([^\n]+)/i);
      extracted.remarks = remarksMatch ? remarksMatch[1].trim() : undefined;

      setDocument((prev) => ({ ...prev, ...extracted, raw_text: text }));
    } catch (error) {
      console.error("Extraction error:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const convertToLaravelFormat = ():
    | LaravelDelivery
    | LaravelInvoice
    | LaravelOrder
    | LaravelQuotation => {
    const baseItems = document.items.map((item) => ({
      product_name: item.product_name,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      tax_amount: item.tax_amount,
      remarks: item.remarks || undefined,
    }));

    switch (document.document_type) {
      case "delivery":
        return {
          company_id: document.company_id,
          client_id: document.client_id,
          total_amount: document.total_amount,
          total_tax: document.total_tax,
          consumption_tax_display: document.consumption_tax_display,
          fraction_calculation: document.fraction_calculation,
          delivery_date: document.issue_date,
          remarks: document.remarks,
          items: baseItems.map((item) => ({
            ...item,
            total_price:
              document.items.find((i) => i.product_name === item.product_name)
                ?.total_price || "",
          })),
        } as LaravelDelivery;

      case "invoice":
        return {
          company_id: document.company_id,
          client_id: document.client_id,
          client_name: document.client_name,
          issue_date: document.issue_date,
          closing_date: document.closing_date,
          collection_date: document.collection_date,
          consumption_tax_display: document.consumption_tax_display,
          fraction_calculation: document.fraction_calculation,
          purchase_amount: document.total_amount,
          consumption_tax_amount: document.total_tax,
          total_purchase: document.grand_total,
          amount_billed: document.grand_total,
          bank_name: document.bank_name,
          bank_account_name: document.bank_account_name,
          bank_branch_name: document.bank_branch_name,
          bank_account_type: document.bank_account_type,
          bank_account_number: document.bank_account_number,
          items: baseItems.map((item) => ({
            ...item,
            sales_amount:
              document.items.find((i) => i.product_name === item.product_name)
                ?.sales_amount || "",
            sales_date: document.items.find(
              (i) => i.product_name === item.product_name
            )?.sales_date,
          })),
        } as LaravelInvoice;

      case "order":
        return {
          company_id: document.company_id,
          client_id: document.client_id,
          special_notes: document.special_notes,
          total_amount: document.total_amount,
          total_tax: document.total_tax,
          grand_total: document.grand_total,
          consumption_tax_display: document.consumption_tax_display,
          fraction_calculation: document.fraction_calculation,
          order_date: document.issue_date,
          items: baseItems.map((item) => ({
            ...item,
            product_code: document.items.find(
              (i) => i.product_name === item.product_name
            )?.product_code,
            total_price:
              document.items.find((i) => i.product_name === item.product_name)
                ?.total_price || "",
          })),
          details: document.details,
        } as LaravelOrder;

      case "quotation":
        return {
          company_id: document.company_id,
          client_id: document.client_id,
          quotation_number: document.document_number,
          version: document.version,
          total_amount: document.total_amount,
          total_tax: document.total_tax,
          consumption_tax_display: document.consumption_tax_display,
          fraction_calculation: document.fraction_calculation,
          quotation_date: document.issue_date,
          expiry_date: document.expiry_date,
          subject: document.subject,
          remarks: document.remarks,
          special_notes: document.special_notes,
          items: baseItems.map((item) => ({
            ...item,
            sales_amount:
              document.items.find((i) => i.product_name === item.product_name)
                ?.sales_amount || "",
          })),
          details: document.details,
        } as LaravelQuotation;
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setDocument((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    index: number,
    field: keyof DocumentItem,
    value: string
  ) => {
    const newItems = [...document.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setDocument((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setDocument((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_name: "",
          unit: "",
          quantity: "",
          unit_price: "",
          total_price: "",
          tax_rate: "10",
          tax_amount: "",
          remarks: "",
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setDocument((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const exportUniversalJSON = () => {
    const blob = new Blob([JSON.stringify(document, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = (document as any).createElement("a");
    a.href = url;
    a.download = `document-${document.document_number || "universal"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLaravelJSON = () => {
    const laravelData = convertToLaravelFormat();
    const blob = new Blob([JSON.stringify(laravelData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = (document as any).createElement("a");
    a.href = url;
    a.download = `${document.document_type}-laravel-${document.document_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyUniversalJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(document, null, 2));
    alert("Universal document data copied!");
  };

  const copyLaravelJSON = () => {
    const laravelData = convertToLaravelFormat();
    navigator.clipboard.writeText(JSON.stringify(laravelData, null, 2));
    alert("Laravel-formatted data copied!");
  };

  const resetFields = () => {
    setDocument({
      document_type: "delivery",
      document_number: "",
      company_name: "",
      company_address: "",
      company_postal_code: "",
      company_phone: "",
      company_registration_number: "",
      client_name: "",
      client_address: "",
      client_postal_code: "",
      issue_date: "",
      items: [],
      total_amount: "",
      total_tax: "",
      grand_total: "",
      consumption_tax_display: 0,
      fraction_calculation: 2,
    });
  };

  if (!text) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-purple-600" />
          Universal Document Extraction
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={extractDocumentFields}
            disabled={isExtracting}
            size="sm"
            className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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

      <div className="bg-linear-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 space-y-4">
        {/* Document Type Selector */}
        <div>
          <label className="text-xs font-medium text-gray-700">
            Document Type
          </label>
          <select
            value={document.document_type}
            onChange={(e) => handleFieldChange("document_type", e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
          >
            <option value="delivery">Delivery Slip (納品書)</option>
            <option value="invoice">Invoice (請求書)</option>
            <option value="order">Order (注文書)</option>
            <option value="quotation">Quotation (見積書)</option>
          </select>
        </div>

        {/* Document Info */}
        <div>
          <h3 className="font-semibold text-sm mb-2 text-purple-800">
            Document Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Document Number
              </label>
              <input
                type="text"
                value={document.document_number}
                onChange={(e) =>
                  handleFieldChange("document_number", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Issue Date
              </label>
              <input
                type="text"
                value={document.issue_date}
                onChange={(e) =>
                  handleFieldChange("issue_date", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {document.document_type === "quotation" && (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Version
                  </label>
                  <input
                    type="text"
                    value={document.version || ""}
                    onChange={(e) =>
                      handleFieldChange("version", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={document.expiry_date || ""}
                    onChange={(e) =>
                      handleFieldChange("expiry_date", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Company Info */}
        <div>
          <h3 className="font-semibold text-sm mb-2 text-purple-800">
            Company/Vendor Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                value={document.company_name}
                onChange={(e) =>
                  handleFieldChange("company_name", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                value={document.company_postal_code}
                onChange={(e) =>
                  handleFieldChange("company_postal_code", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={document.company_address}
                onChange={(e) =>
                  handleFieldChange("company_address", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Phone</label>
              <input
                type="text"
                value={document.company_phone}
                onChange={(e) =>
                  handleFieldChange("company_phone", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Registration Number
              </label>
              <input
                type="text"
                value={document.company_registration_number}
                onChange={(e) =>
                  handleFieldChange(
                    "company_registration_number",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div>
          <h3 className="font-semibold text-sm mb-2 text-purple-800">
            Client/Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Client Name
              </label>
              <input
                type="text"
                value={document.client_name}
                onChange={(e) =>
                  handleFieldChange("client_name", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                value={document.client_postal_code}
                onChange={(e) =>
                  handleFieldChange("client_postal_code", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={document.client_address}
                onChange={(e) =>
                  handleFieldChange("client_address", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-purple-800">
              Line Items
            </h3>
            <Button
              onClick={addItem}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              + Add Item
            </Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {document.items.map((item, idx) => (
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={item.product_name}
                      onChange={(e) =>
                        handleItemChange(idx, "product_name", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Product Name"
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
                      placeholder="Quantity"
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
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(idx, "unit_price", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Unit Price"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.total_price}
                      onChange={(e) =>
                        handleItemChange(idx, "total_price", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Total"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.tax_rate}
                      onChange={(e) =>
                        handleItemChange(idx, "tax_rate", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Tax %"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.tax_amount}
                      onChange={(e) =>
                        handleItemChange(idx, "tax_amount", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border rounded"
                      placeholder="Tax Amount"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div>
          <h3 className="font-semibold text-sm mb-2 text-purple-800">
            Financial Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Subtotal (Excl. Tax)
              </label>
              <input
                type="text"
                value={document.total_amount}
                onChange={(e) =>
                  handleFieldChange("total_amount", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="¥2,507,000"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Total Tax
              </label>
              <input
                type="text"
                value={document.total_tax}
                onChange={(e) => handleFieldChange("total_tax", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="¥250,700"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Grand Total
              </label>
              <input
                type="text"
                value={document.grand_total}
                onChange={(e) =>
                  handleFieldChange("grand_total", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 font-semibold"
                placeholder="¥2,757,700"
              />
            </div>
          </div>
        </div>

        {/* Tax Configuration */}
        <div>
          <h3 className="font-semibold text-sm mb-2 text-purple-800">
            Tax Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Tax Display
              </label>
              <select
                value={document.consumption_tax_display}
                onChange={(e) =>
                  handleFieldChange(
                    "consumption_tax_display",
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value={0}>Exclude Tax (外税)</option>
                <option value={1}>Include Tax (内税)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Fraction Calculation
              </label>
              <select
                value={document.fraction_calculation}
                onChange={(e) =>
                  handleFieldChange(
                    "fraction_calculation",
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value={0}>Round Down (切り捨て)</option>
                <option value={1}>Round Up (切り上げ)</option>
                <option value={2}>Round Off (四捨五入)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bank Info (for invoices) */}
        {document.document_type === "invoice" && (
          <div>
            <h3 className="font-semibold text-sm mb-2 text-purple-800">
              Bank Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={document.bank_name || ""}
                  onChange={(e) =>
                    handleFieldChange("bank_name", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={document.bank_branch_name || ""}
                  onChange={(e) =>
                    handleFieldChange("bank_branch_name", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Account Name
                </label>
                <input
                  type="text"
                  value={document.bank_account_name || ""}
                  onChange={(e) =>
                    handleFieldChange("bank_account_name", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Account Type
                </label>
                <select
                  value={document.bank_account_type || 1}
                  onChange={(e) =>
                    handleFieldChange(
                      "bank_account_type",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value={1}>Savings (普通)</option>
                  <option value={2}>Current (当座)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  value={document.bank_account_number || ""}
                  onChange={(e) =>
                    handleFieldChange("bank_account_number", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional Details (for orders/quotations) */}
        {(document.document_type === "order" ||
          document.document_type === "quotation") && (
          <div>
            <h3 className="font-semibold text-sm mb-2 text-purple-800">
              Additional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Delivery Date
                </label>
                <input
                  type="text"
                  value={document.details?.delivery_date || ""}
                  onChange={(e) =>
                    handleFieldChange("details", {
                      ...document.details,
                      delivery_date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Delivery Place
                </label>
                <input
                  type="text"
                  value={document.details?.delivery_place || ""}
                  onChange={(e) =>
                    handleFieldChange("details", {
                      ...document.details,
                      delivery_place: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-700">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={document.details?.payment_terms || ""}
                  onChange={(e) =>
                    handleFieldChange("details", {
                      ...document.details,
                      payment_terms: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Subject (for quotations) */}
        {document.document_type === "quotation" && (
          <div>
            <label className="text-xs font-medium text-gray-700">Subject</label>
            <input
              type="text"
              value={document.subject || ""}
              onChange={(e) => handleFieldChange("subject", e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {/* Remarks */}
        <div>
          <label className="text-xs font-medium text-gray-700">
            Remarks / Notes
          </label>
          <textarea
            value={document.remarks || ""}
            onChange={(e) => handleFieldChange("remarks", e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500"
            rows={2}
          />
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={copyUniversalJSON}
            className="flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy Universal JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportUniversalJSON}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Download Universal
          </Button>
          <Button
            size="sm"
            onClick={copyLaravelJSON}
            className="flex items-center gap-1 bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            <Database className="w-4 h-4" />
            Copy Laravel JSON
          </Button>
          <Button
            size="sm"
            onClick={exportLaravelJSON}
            className="flex items-center gap-1 bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            <Download className="w-4 h-4" />
            Download Laravel
          </Button>
        </div>
      </div>
    </div>
  );
};
