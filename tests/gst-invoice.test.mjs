import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('GST Invoice: Component implements legal Indian GST tax invoice specifications', () => {
  const code = fs.readFileSync('src/components/customer/GstInvoiceModal.tsx', 'utf8');
  assert.match(code, /999719/, 'Must include Laundry SAC Code 999719');
  assert.match(code, /CGST/i, 'Must itemize CGST (9%)');
  assert.match(code, /SGST/i, 'Must itemize SGST (9%)');
  assert.match(code, /Taxable Value|Taxable Amount/i, 'Must display taxable value');
  assert.match(code, /GSTIN/i, 'Must display company GSTIN');
});

test('Customer Orders: Triggers dedicated GST Invoice modal rather than raw window.print()', () => {
  const ordersPage = fs.readFileSync('src/app/customer/orders/page.tsx', 'utf8');
  assert.match(ordersPage, /GstInvoiceModal/, 'Orders page must import GstInvoiceModal');
  assert.doesNotMatch(ordersPage, /onClick=\{\(\)\s*=>\s*window\.print\(\)\}/, 'Must not use raw window.print() on page');
});

