import { ParsedReceiptData } from '../server/receiptParser';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  webViewLink?: string;
  sheetTitle: string;
  rowCount: number;
}

export const DEFAULT_SHEET_TITLE = 'iGO Enterprises - Expense Tracker & Receipt Logs';
export const DEFAULT_TAB_NAME = 'Expenses';

export const SHEET_HEADERS = [
  'Expense ID',
  'Date',
  'Merchant',
  'Category',
  'Total Amount',
  'Currency',
  'Tax',
  'Tip',
  'Payment Method',
  'Items Breakdown',
  'Notes / Invoice #',
  'Confidence',
  'Logged At',
];

/**
 * Searches user's Google Drive for existing spreadsheets that look like expense trackers.
 */
export async function searchExpenseSpreadsheets(accessToken: string): Promise<SpreadsheetInfo[]> {
  try {
    const q = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&orderBy=modifiedTime desc&pageSize=15`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      console.warn('Failed to query drive files, falling back to manual spreadsheet creation');
      return [];
    }

    const data = await res.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      sheetTitle: DEFAULT_TAB_NAME,
      rowCount: 0,
    }));
  } catch (err) {
    console.error('Error searching spreadsheets:', err);
    return [];
  }
}

/**
 * Creates a brand-new structured Expense Tracker Google Sheet with stylized headers and frozen row.
 */
export async function createExpenseSpreadsheet(
  accessToken: string,
  customTitle: string = DEFAULT_SHEET_TITLE
): Promise<SpreadsheetInfo> {
  const requestBody = {
    properties: {
      title: customTitle,
    },
    sheets: [
      {
        properties: {
          title: DEFAULT_TAB_NAME,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 100,
            columnCount: 15,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: SHEET_HEADERS.map((header) => ({
                  userEnteredValue: { stringValue: header },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.05, green: 0.58, blue: 0.41 }, // Emerald Green
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                      bold: true,
                      fontSize: 10,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                })),
              },
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  return {
    id: spreadsheetId,
    name: customTitle,
    webViewLink: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetTitle: DEFAULT_TAB_NAME,
    rowCount: 1,
  };
}

/**
 * Ensures header row exists in an existing or selected sheet tab.
 */
export async function ensureSheetHeaders(
  accessToken: string,
  spreadsheetId: string,
  tabName: string = DEFAULT_TAB_NAME
): Promise<void> {
  try {
    const checkRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:M1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (checkRes.ok) {
      const data = await checkRes.json();
      if (data.values && data.values.length > 0 && data.values[0].length >= 3) {
        // Headers already present
        return;
      }
    }

    // Set headers
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:M1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [SHEET_HEADERS],
        }),
      }
    );
  } catch (err) {
    console.error('Error ensuring sheet headers:', err);
  }
}

/**
 * Appends a parsed receipt expense row to the Google Sheet.
 */
export async function appendExpenseToSheet(
  accessToken: string,
  spreadsheetId: string,
  expense: ParsedReceiptData,
  tabName: string = DEFAULT_TAB_NAME
): Promise<{ success: boolean; updatedRange?: string; updatedRows?: number }> {
  // Format items summary
  const itemsText = expense.items && expense.items.length > 0
    ? expense.items.map((it) => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.description} (${expense.currencySymbol || '$'}${it.totalPrice.toFixed(2)})`).join('; ')
    : 'No itemized breakdown';

  const notesText = [
    expense.invoiceNumber ? `Invoice #${expense.invoiceNumber}` : '',
    expense.cardLast4 ? `Card ...${expense.cardLast4}` : '',
    expense.notes ? expense.notes : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const rowValues = [
    expense.id,
    expense.date,
    expense.merchantName,
    expense.category,
    expense.totalAmount,
    expense.currency,
    expense.taxAmount || 0,
    expense.tipAmount || 0,
    expense.paymentMethod,
    itemsText,
    notesText,
    `${Math.round(expense.confidenceScore * 100)}%`,
    new Date(expense.createdAt).toLocaleString(),
  ];

  const range = `${tabName}!A:M`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to append expense to sheet: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    success: true,
    updatedRange: data.updates?.updatedRange,
    updatedRows: data.updates?.updatedRows,
  };
}

/**
 * Fetches all logged expense rows from the Google Sheet.
 */
export async function fetchExpensesFromSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string = DEFAULT_TAB_NAME
): Promise<{ expenses: ParsedReceiptData[]; totalCount: number }> {
  const range = `${tabName}!A2:M1000`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch expenses: ${res.statusText}`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  const expenses: ParsedReceiptData[] = rows
    .filter((r) => r.length >= 3 && r[2]) // Must have at least ID, Date, Merchant
    .map((r, index) => {
      const id = r[0] || `sheet_row_${index + 2}`;
      const date = r[1] || '';
      const merchantName = r[2] || 'Unknown Merchant';
      const category = r[3] || 'Other Expenses';
      const totalAmount = parseFloat(r[4]) || 0;
      const currency = r[5] || 'USD';
      const taxAmount = parseFloat(r[6]) || 0;
      const tipAmount = parseFloat(r[7]) || 0;
      const paymentMethod = r[8] || 'Credit Card';
      const itemsBreakdown = r[9] || '';
      const notes = r[10] || '';
      const confidence = parseFloat(r[11]) ? parseFloat(r[11]) / 100 : 0.95;
      const createdAt = r[12] || new Date().toISOString();

      // Parse items summary if present
      const items = itemsBreakdown
        ? itemsBreakdown.split('; ').map((itemStr: string) => {
            const match = itemStr.match(/(?:(\d+)x\s+)?([^(]+)(?:\(([^)]+)\))?/);
            return {
              description: match ? match[2].trim() : itemStr.trim(),
              quantity: match && match[1] ? parseInt(match[1], 10) : 1,
              unitPrice: 0,
              totalPrice: 0,
            };
          })
        : [];

      return {
        id,
        merchantName,
        date,
        totalAmount,
        currency,
        currencySymbol: currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'PHP' ? '₱' : '$',
        taxAmount,
        tipAmount,
        paymentMethod,
        category,
        items,
        notes,
        confidenceScore: confidence,
        createdAt,
        sheetSynced: true,
        sheetRowIndex: index + 2,
      };
    });

  return {
    expenses,
    totalCount: expenses.length,
  };
}

/**
 * Deletes a specific expense row from the Google Sheet.
 */
export async function deleteExpenseRowFromSheet(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number,
  tabName: string = DEFAULT_TAB_NAME
): Promise<boolean> {
  try {
    // 1. Get the numeric sheetId of the target tab
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!metaRes.ok) {
      console.warn('Could not fetch spreadsheet metadata to find tab ID');
      return false;
    }

    const metaData = await metaRes.json();
    const sheetObj = (metaData.sheets || []).find(
      (s: any) => s.properties?.title === tabName
    ) || metaData.sheets?.[0];

    const numericSheetId = sheetObj?.properties?.sheetId ?? 0;

    // 2. Execute deleteDimension batchUpdate
    const deleteRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: numericSheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1, // 0-indexed start
                  endIndex: rowIndex, // exclusive end
                },
              },
            },
          ],
        }),
      }
    );

    return deleteRes.ok;
  } catch (err) {
    console.error('Error deleting row from Google Sheet:', err);
    return false;
  }
}

