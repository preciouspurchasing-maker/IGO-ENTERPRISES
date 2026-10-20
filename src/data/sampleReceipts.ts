export interface SampleReceipt {
  id: string;
  title: string;
  vendor: string;
  category: string;
  date: string;
  total: number;
  currency: string;
  currencySymbol: string;
  items: { description: string; quantity: number; unitPrice: number; totalPrice: number }[];
  tax: number;
  tip: number;
  paymentMethod: string;
  invoiceNumber: string;
  notes: string;
  svgImage: string;
}

// Generate high fidelity realistic SVG receipts that look like real physical receipts
export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'sample-1',
    title: 'Starbucks Coffee & Snacks',
    vendor: 'STARBUCKS COFFEE #1042',
    category: 'Meals & Dining',
    date: '2026-10-18',
    total: 19.85,
    currency: 'USD',
    currencySymbol: '$',
    items: [
      { description: 'Venti Iced Caramel Macchiato', quantity: 2, unitPrice: 6.25, totalPrice: 12.50 },
      { description: 'Butter Croissant', quantity: 1, unitPrice: 3.95, totalPrice: 3.95 },
      { description: 'Blueberry Scone', quantity: 1, unitPrice: 3.40, totalPrice: 3.40 },
    ],
    tax: 1.55,
    tip: 0.00,
    paymentMethod: 'Apple Pay (Visa ...4129)',
    invoiceNumber: 'TXN-984210',
    notes: 'Team morning sync refreshments',
    svgImage: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="380" height="520" viewBox="0 0 380 520">
      <defs>
        <filter id="paper-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.15" />
        </filter>
      </defs>
      <rect x="15" y="15" width="350" height="490" rx="4" fill="#faf8f2" stroke="#e2ded4" stroke-width="1.5" filter="url(#paper-shadow)" />
      <!-- Jagged receipt top -->
      <path d="M 15,15 L 30,22 L 45,15 L 60,22 L 75,15 L 90,22 L 105,15 L 120,22 L 135,15 L 150,22 L 165,15 L 180,22 L 195,15 L 210,22 L 225,15 L 240,22 L 255,15 L 270,22 L 285,15 L 300,22 L 315,15 L 330,22 L 345,15 L 365,15 L 365,490 L 15,490 Z" fill="#faf8f2" />
      <text x="190" y="55" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" fill="#1e293b">★ STARBUCKS COFFEE ★</text>
      <text x="190" y="74" font-family="monospace" font-size="11" text-anchor="middle" fill="#64748b">Store #1042 - Market St Plaza</text>
      <text x="190" y="90" font-family="monospace" font-size="10" text-anchor="middle" fill="#64748b">Tel: (415) 555-0199</text>
      <line x1="35" y1="105" x2="345" y2="105" stroke="#94a3b8" stroke-dasharray="4 3" stroke-width="1" />
      <text x="35" y="125" font-family="monospace" font-size="11" fill="#334155">DATE: 2026-10-18</text>
      <text x="260" y="125" font-family="monospace" font-size="11" fill="#334155">TIME: 08:42 AM</text>
      <text x="35" y="145" font-family="monospace" font-size="11" fill="#334155">TXN: #984210</text>
      <text x="240" y="145" font-family="monospace" font-size="11" fill="#334155">REG: 04</text>
      <line x1="35" y1="160" x2="345" y2="160" stroke="#94a3b8" stroke-dasharray="4 3" stroke-width="1" />
      <text x="35" y="185" font-family="monospace" font-size="11" fill="#1e293b">2x Venti Caramel Macch</text>
      <text x="310" y="185" font-family="monospace" font-size="11" text-anchor="end" fill="#1e293b">$12.50</text>
      <text x="35" y="210" font-family="monospace" font-size="11" fill="#1e293b">1x Butter Croissant</text>
      <text x="310" y="210" font-family="monospace" font-size="11" text-anchor="end" fill="#1e293b">$3.95</text>
      <text x="35" y="235" font-family="monospace" font-size="11" fill="#1e293b">1x Blueberry Scone</text>
      <text x="310" y="235" font-family="monospace" font-size="11" text-anchor="end" fill="#1e293b">$3.40</text>
      <line x1="35" y1="255" x2="345" y2="255" stroke="#cbd5e1" stroke-width="1" />
      <text x="35" y="278" font-family="monospace" font-size="11" fill="#64748b">SUBTOTAL</text>
      <text x="310" y="278" font-family="monospace" font-size="11" text-anchor="end" fill="#334155">$19.85</text>
      <text x="35" y="300" font-family="monospace" font-size="11" fill="#64748b">TAX (8.5%)</text>
      <text x="310" y="300" font-family="monospace" font-size="11" text-anchor="end" fill="#334155">$1.55</text>
      <line x1="35" y1="320" x2="345" y2="320" stroke="#0f172a" stroke-width="1.5" />
      <text x="35" y="345" font-family="monospace" font-size="15" font-weight="bold" fill="#0f172a">TOTAL DUE</text>
      <text x="310" y="345" font-family="monospace" font-size="16" font-weight="bold" text-anchor="end" fill="#0f172a">$19.85</text>
      <line x1="35" y1="365" x2="345" y2="365" stroke="#0f172a" stroke-width="1.5" />
      <text x="35" y="390" font-family="monospace" font-size="11" fill="#334155">PAYMENT: Apple Pay (Visa ...4129)</text>
      <text x="35" y="410" font-family="monospace" font-size="11" fill="#334155">AUTH: 09419A</text>
      <text x="190" y="450" font-family="monospace" font-size="11" text-anchor="middle" fill="#64748b">*** THANK YOU FOR VISITING ***</text>
      <text x="190" y="468" font-family="monospace" font-size="9" text-anchor="middle" fill="#94a3b8">Retain receipt for business expenses</text>
    </svg>`,
  },
  {
    id: 'sample-2',
    title: 'Uber Airport Transit',
    vendor: 'UBER TECHNOLOGIES INC.',
    category: 'Travel & Transportation',
    date: '2026-10-17',
    total: 44.80,
    currency: 'USD',
    currencySymbol: '$',
    items: [
      { description: 'UberX Trip - SFO to Downtown Office', quantity: 1, unitPrice: 38.50, totalPrice: 38.50 },
      { description: 'Airport Surcharge & Tolls', quantity: 1, unitPrice: 6.30, totalPrice: 6.30 },
    ],
    tax: 0.00,
    tip: 5.00,
    paymentMethod: 'Corporate Amex ...1004',
    invoiceNumber: 'UBR-77402-9A',
    notes: 'Airport transfer after business client trip',
    svgImage: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="380" height="520" viewBox="0 0 380 520">
      <defs>
        <filter id="shadow2" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.15" />
        </filter>
      </defs>
      <rect x="15" y="15" width="350" height="490" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" filter="url(#shadow2)" />
      <rect x="15" y="15" width="350" height="60" rx="6" fill="#000000" />
      <text x="35" y="52" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff">Uber</text>
      <text x="330" y="52" font-family="sans-serif" font-size="12" text-anchor="end" fill="#94a3b8">TRIP RECEIPT</text>
      <text x="35" y="110" font-family="sans-serif" font-size="12" fill="#64748b">Date</text>
      <text x="35" y="130" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Oct 17, 2026 • 6:15 PM</text>
      <text x="230" y="110" font-family="sans-serif" font-size="12" fill="#64748b">Trip Code</text>
      <text x="230" y="130" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">#UBR-77402</text>
      <line x1="35" y1="150" x2="345" y2="150" stroke="#e2e8f0" stroke-width="1" />
      <text x="35" y="180" font-family="sans-serif" font-size="13" fill="#334155">Trip Fare (SFO to Downtown)</text>
      <text x="345" y="180" font-family="sans-serif" font-size="13" text-anchor="end" fill="#0f172a">$38.50</text>
      <text x="35" y="210" font-family="sans-serif" font-size="13" fill="#334155">Airport Surcharge / Tolls</text>
      <text x="345" y="210" font-family="sans-serif" font-size="13" text-anchor="end" fill="#0f172a">$6.30</text>
      <text x="35" y="240" font-family="sans-serif" font-size="13" fill="#334155">Driver Tip</text>
      <text x="345" y="240" font-family="sans-serif" font-size="13" text-anchor="end" fill="#0f172a">$5.00</text>
      <line x1="35" y1="270" x2="345" y2="270" stroke="#0f172a" stroke-width="1.5" />
      <text x="35" y="305" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a">Total Amount Paid</text>
      <text x="345" y="305" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="end" fill="#059669">$44.80</text>
      <line x1="35" y1="330" x2="345" y2="330" stroke="#e2e8f0" stroke-width="1" />
      <text x="35" y="360" font-family="sans-serif" font-size="12" fill="#64748b">Charged to:</text>
      <text x="35" y="380" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Corporate Amex •••• 1004</text>
      <text x="35" y="420" font-family="sans-serif" font-size="11" fill="#64748b">Distance: 14.8 miles • Duration: 29 min</text>
      <text x="35" y="440" font-family="sans-serif" font-size="11" fill="#64748b">Rider: Precious Purchasing</text>
      <rect x="35" y="460" width="310" height="28" rx="4" fill="#f1f5f9" />
      <text x="190" y="478" font-family="sans-serif" font-size="10" text-anchor="middle" fill="#64748b">Automated electronic travel expense voucher</text>
    </svg>`,
  },
  {
    id: 'sample-3',
    title: 'Staples Office Supplies',
    vendor: 'STAPLES STORE #481',
    category: 'Office Supplies',
    date: '2026-10-16',
    total: 82.47,
    currency: 'USD',
    currencySymbol: '$',
    items: [
      { description: 'HP Laser Printer Paper 5-Ream', quantity: 1, unitPrice: 38.99, totalPrice: 38.99 },
      { description: 'Expo Dry Erase Markers 8-Pack', quantity: 2, unitPrice: 12.49, totalPrice: 24.98 },
      { description: 'Post-it Super Sticky Notes Cube', quantity: 1, unitPrice: 11.50, totalPrice: 11.50 },
    ],
    tax: 7.00,
    tip: 0.00,
    paymentMethod: 'MasterCard ...5531',
    invoiceNumber: 'INV-88390',
    notes: 'Q4 office stationeries and meeting room supplies',
    svgImage: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="380" height="520" viewBox="0 0 380 520">
      <defs>
        <filter id="shadow3" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.15" />
        </filter>
      </defs>
      <rect x="15" y="15" width="350" height="490" rx="3" fill="#fefefe" stroke="#e2e8f0" stroke-width="1.5" filter="url(#shadow3)" />
      <text x="190" y="58" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle" fill="#dc2626">STAPLES</text>
      <text x="190" y="78" font-family="monospace" font-size="11" text-anchor="middle" fill="#64748b">Store 481 - Commercial Center</text>
      <line x1="35" y1="95" x2="345" y2="95" stroke="#cbd5e1" stroke-dasharray="3 3" />
      <text x="35" y="120" font-family="monospace" font-size="11" fill="#475569">DATE: 2026-10-16</text>
      <text x="240" y="120" font-family="monospace" font-size="11" fill="#475569">INV: 88390</text>
      <line x1="35" y1="140" x2="345" y2="140" stroke="#cbd5e1" stroke-dasharray="3 3" />
      <text x="35" y="168" font-family="monospace" font-size="11" fill="#0f172a">HP LASER PAPER 5-REAM</text>
      <text x="345" y="168" font-family="monospace" font-size="11" text-anchor="end" fill="#0f172a">$38.99</text>
      <text x="35" y="195" font-family="monospace" font-size="11" fill="#0f172a">2x EXPO MARKERS 8PK</text>
      <text x="345" y="195" font-family="monospace" font-size="11" text-anchor="end" fill="#0f172a">$24.98</text>
      <text x="35" y="222" font-family="monospace" font-size="11" fill="#0f172a">POST-IT NOTES CUBE</text>
      <text x="345" y="222" font-family="monospace" font-size="11" text-anchor="end" fill="#0f172a">$11.50</text>
      <line x1="35" y1="245" x2="345" y2="245" stroke="#e2e8f0" />
      <text x="35" y="270" font-family="monospace" font-size="11" fill="#64748b">SUBTOTAL</text>
      <text x="345" y="270" font-family="monospace" font-size="11" text-anchor="end" fill="#0f172a">$75.47</text>
      <text x="35" y="295" font-family="monospace" font-size="11" fill="#64748b">SALES TAX (9.28%)</text>
      <text x="345" y="295" font-family="monospace" font-size="11" text-anchor="end" fill="#0f172a">$7.00</text>
      <line x1="35" y1="315" x2="345" y2="315" stroke="#0f172a" stroke-width="2" />
      <text x="35" y="345" font-family="monospace" font-size="16" font-weight="bold" fill="#0f172a">TOTAL SALE</text>
      <text x="345" y="345" font-family="monospace" font-size="17" font-weight="bold" text-anchor="end" fill="#0f172a">$82.47</text>
      <line x1="35" y1="365" x2="345" y2="365" stroke="#0f172a" stroke-width="2" />
      <text x="35" y="395" font-family="monospace" font-size="11" fill="#475569">PAYMENT: MasterCard ...5531</text>
      <text x="35" y="415" font-family="monospace" font-size="11" fill="#475569">AUTH: 541091 - CHIP READ</text>
      <text x="190" y="460" font-family="monospace" font-size="10" text-anchor="middle" fill="#94a3b8">THANK YOU FOR SHOPPING AT STAPLES</text>
    </svg>`,
  },
  {
    id: 'sample-4',
    title: 'Cloudflare SaaS Subscription',
    vendor: 'CLOUDFLARE INC.',
    category: 'Software & SaaS',
    date: '2026-10-15',
    total: 200.00,
    currency: 'USD',
    currencySymbol: '$',
    items: [
      { description: 'Cloudflare Pro Plan - Monthly', quantity: 1, unitPrice: 20.00, totalPrice: 20.00 },
      { description: 'Workers Paid & KV Storage', quantity: 1, unitPrice: 180.00, totalPrice: 180.00 },
    ],
    tax: 0.00,
    tip: 0.00,
    paymentMethod: 'Corporate Visa ...9920',
    invoiceNumber: 'CF-2026-8910',
    notes: 'Monthly infrastructure and CDN hosting services',
    svgImage: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="380" height="520" viewBox="0 0 380 520">
      <defs>
        <filter id="shadow4" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.15" />
        </filter>
      </defs>
      <rect x="15" y="15" width="350" height="490" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="url(#shadow4)" />
      <rect x="15" y="15" width="350" height="50" rx="6" fill="#f97316" />
      <text x="35" y="46" font-family="sans-serif" font-size="18" font-weight="bold" fill="#ffffff">CLOUDFLARE</text>
      <text x="330" y="46" font-family="sans-serif" font-size="12" text-anchor="end" fill="#ffffff">INVOICE</text>
      <text x="35" y="95" font-family="sans-serif" font-size="11" fill="#64748b">Invoice Number</text>
      <text x="35" y="115" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">#CF-2026-8910</text>
      <text x="240" y="95" font-family="sans-serif" font-size="11" fill="#64748b">Billing Date</text>
      <text x="240" y="115" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Oct 15, 2026</text>
      <line x1="35" y1="135" x2="345" y2="135" stroke="#e2e8f0" stroke-width="1" />
      <text x="35" y="165" font-family="sans-serif" font-size="13" fill="#334155">Cloudflare Pro Plan</text>
      <text x="345" y="165" font-family="sans-serif" font-size="13" text-anchor="end" fill="#0f172a">$20.00</text>
      <text x="35" y="195" font-family="sans-serif" font-size="13" fill="#334155">Workers Paid + KV Compute</text>
      <text x="345" y="195" font-family="sans-serif" font-size="13" text-anchor="end" fill="#0f172a">$180.00</text>
      <line x1="35" y1="230" x2="345" y2="230" stroke="#e2e8f0" stroke-width="1" />
      <text x="35" y="270" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a">Total Paid (USD)</text>
      <text x="345" y="270" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="end" fill="#059669">$200.00</text>
      <rect x="35" y="300" width="310" height="40" rx="4" fill="#ecfdf5" stroke="#a7f3d0" />
      <text x="190" y="325" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#065f46">STATUS: PAID IN FULL</text>
      <text x="35" y="375" font-family="sans-serif" font-size="11" fill="#64748b">Payment: Corporate Visa •••• 9920</text>
      <text x="35" y="395" font-family="sans-serif" font-size="11" fill="#64748b">Account: precious_purchasing@igoenterprises.com</text>
    </svg>`,
  },
];
