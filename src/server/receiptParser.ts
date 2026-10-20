import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export interface ParsedReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ParsedReceiptData {
  id: string;
  merchantName: string;
  merchantAddress?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  invoiceNumber?: string;
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  tipAmount?: number;
  currency: string;
  currencySymbol: string;
  paymentMethod: string;
  cardLast4?: string;
  category: string;
  items: ParsedReceiptItem[];
  notes?: string;
  confidenceScore: number;
  rawTextSummary?: string;
  createdAt: string;
  sheetSynced?: boolean;
  sheetRowIndex?: number;
  receiptImageUrl?: string;
}

const receiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    merchantName: {
      type: Type.STRING,
      description: 'The name of the store, restaurant, vendor, or business.',
    },
    merchantAddress: {
      type: Type.STRING,
      description: 'Address, city, or location of the merchant if visible.',
    },
    date: {
      type: Type.STRING,
      description: 'Transaction date in YYYY-MM-DD format (e.g. 2026-10-19). Infer current year if ambiguous.',
    },
    time: {
      type: Type.STRING,
      description: 'Time of transaction if visible (e.g. 14:32).',
    },
    invoiceNumber: {
      type: Type.STRING,
      description: 'Receipt number, invoice ID, transaction reference or check number.',
    },
    totalAmount: {
      type: Type.NUMBER,
      description: 'The final total grand amount paid.',
    },
    subtotal: {
      type: Type.NUMBER,
      description: 'Subtotal before taxes or discounts.',
    },
    taxAmount: {
      type: Type.NUMBER,
      description: 'Total tax, VAT, GST, or sales tax amount.',
    },
    tipAmount: {
      type: Type.NUMBER,
      description: 'Tip or gratuity or service charge amount if present.',
    },
    currency: {
      type: Type.STRING,
      description: 'Three letter currency code like USD, EUR, GBP, PHP, CAD, AUD, JPY, SGD.',
    },
    currencySymbol: {
      type: Type.STRING,
      description: 'Currency symbol like $, €, £, ₱, ¥.',
    },
    paymentMethod: {
      type: Type.STRING,
      description: 'Payment method used: Cash, Credit Card, Debit Card, Apple Pay, Google Pay, Bank Transfer, or Other.',
    },
    cardLast4: {
      type: Type.STRING,
      description: 'Last 4 digits of credit/debit card if printed.',
    },
    category: {
      type: Type.STRING,
      description: 'Best business expense category: Meals & Dining, Travel & Transportation, Office Supplies, Software & SaaS, Utilities, Marketing & Ads, Client Entertainment, Facilities & Rent, Logistics & Shipping, or Other Expenses.',
    },
    items: {
      type: Type.ARRAY,
      description: 'Individual line items purchased.',
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: 'Item name or description' },
          quantity: { type: Type.NUMBER, description: 'Quantity purchased (default 1)' },
          unitPrice: { type: Type.NUMBER, description: 'Price per unit' },
          totalPrice: { type: Type.NUMBER, description: 'Total item cost' },
        },
        required: ['description', 'totalPrice'],
      },
    },
    notes: {
      type: Type.STRING,
      description: 'Brief summary of key receipt highlights or notable tax deduction remarks.',
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: 'Confidence between 0.1 and 1.0 on legibility and extraction accuracy.',
    },
  },
  required: ['merchantName', 'date', 'totalAmount', 'currency', 'category'],
};

export async function parseReceiptWithGemini(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<ParsedReceiptData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Clean data URL prefix if present
  let cleanBase64 = base64Data;
  let cleanMime = mimeType;
  if (base64Data.startsWith('data:')) {
    const parts = base64Data.split(';base64,');
    if (parts.length === 2) {
      cleanMime = parts[0].replace('data:', '') || mimeType;
      cleanBase64 = parts[1];
    }
  }

  const prompt = `You are an expert financial auditor and receipt OCR AI. 
Analyze this receipt, bill, invoice, or voucher image carefully.
Extract the merchant name, date (YYYY-MM-DD), invoice/check number, subtotal, tax, tip, final total amount, currency code (e.g. USD, EUR, GBP, PHP), currency symbol, payment method, line items breakdown, and assign the most appropriate business expense category.
If any text is slightly blurry, use context clues to resolve the correct figures. Ensure subtotal + tax roughly equals the total.
Respond strictly in JSON matching the specified schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [
      {
        inlineData: {
          mimeType: cleanMime,
          data: cleanBase64,
        },
      },
      {
        text: prompt,
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: receiptSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No response returned from Gemini receipt analysis');
  }

  const parsed = JSON.parse(text);

  const receiptId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  return {
    id: receiptId,
    merchantName: parsed.merchantName || 'Unknown Merchant',
    merchantAddress: parsed.merchantAddress || '',
    date: parsed.date || new Date().toISOString().split('T')[0],
    time: parsed.time || '',
    invoiceNumber: parsed.invoiceNumber || '',
    totalAmount: typeof parsed.totalAmount === 'number' ? parsed.totalAmount : parseFloat(parsed.totalAmount) || 0,
    subtotal: typeof parsed.subtotal === 'number' ? parsed.subtotal : (parsed.subtotal ? parseFloat(parsed.subtotal) : undefined),
    taxAmount: typeof parsed.taxAmount === 'number' ? parsed.taxAmount : (parsed.taxAmount ? parseFloat(parsed.taxAmount) : 0),
    tipAmount: typeof parsed.tipAmount === 'number' ? parsed.tipAmount : (parsed.tipAmount ? parseFloat(parsed.tipAmount) : 0),
    currency: parsed.currency || 'USD',
    currencySymbol: parsed.currencySymbol || '$',
    paymentMethod: parsed.paymentMethod || 'Credit Card',
    cardLast4: parsed.cardLast4 || '',
    category: parsed.category || 'Other Expenses',
    items: Array.isArray(parsed.items) ? parsed.items.map((it: any) => ({
      description: it.description || 'Item',
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || it.totalPrice || 0,
      totalPrice: it.totalPrice || 0,
    })) : [],
    notes: parsed.notes || '',
    confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
    createdAt: new Date().toISOString(),
    sheetSynced: false,
  };
}
