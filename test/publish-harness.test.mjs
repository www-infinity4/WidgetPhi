// test/publish-harness.test.mjs
// Node.js test harness exercising the full WidgetPhi publish‑sale lifecycle.
// Runs under `npm test` (node --test) and logs evidence objects for each step.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as mock from './helpers/publishMock.js';

// Helper to emit step evidence – in a real CI run these logs can be captured.
function evidence(obj) {
  // eslint‑disable-next-line no-console
  console.log('EVIDENCE:', JSON.stringify(obj));
}

describe('WidgetPhi publish and sale lifecycle', async () => {
  const creator = 'alice';
  const buyer = 'bob';
  const price = 100;
  const initialContent = '<p>Hello World</p>';
  const revisedContent = '<p>Hello Updated</p>';

  test('happy‑path lifecycle', async () => {
    // 1️⃣ Create token
    const token = mock.createToken(creator);
    mock.setPrice(token, price);
    evidence({ step: 'create', token, owner: creator });

    // 2️⃣ Publish site
    const url = mock.publishSite(token, initialContent);
    evidence({ step: 'publish', token, url, mobile: true });
    assert.ok(url.includes(token), 'public URL contains token');

    // 3️⃣ Load site with mobile viewport simulation
    const loaded = mock.loadSite(token, { mobile: true });
    evidence({ step: 'load', token, mobile: true, htmlSnippet: loaded.html.slice(0, 60) });
    assert.ok(loaded.html.includes('site-marker'), 'HTML contains marker');
    assert.ok(loaded.mobile, 'mobile flag is true');

    // 4️⃣ Perform sale
    mock.sellToken(token, buyer, price);
    evidence({ step: 'sale', token, from: creator, to: buyer, amount: price });

    // 5️⃣ New owner edits site
    mock.editSite(token, buyer, revisedContent);
    evidence({ step: 'edit', token, editor: buyer, newContent: revisedContent });
    const afterEdit = mock.loadSite(token);
    assert.ok(afterEdit.html.includes('Hello Updated'), 'content updated by new owner');

    // 6️⃣ Old owner attempts edit – should fail
    assert.throws(
      () => mock.editSite(token, creator, 'malicious'),
      (err) => err.code === 'unauthorized_edit',
      'old owner cannot edit after sale'
    );
    evidence({ step: 'unauthorized_edit_attempt', token, editor: creator });
  });

  test('denied‑path scenarios', async () => {
    const token = mock.createToken(creator);
    mock.setPrice(token, price);
    mock.publishSite(token, initialContent);
    evidence({ step: 'setup_denied', token });

    // Attempt edit by non‑owner before any sale
    assert.throws(
      () => mock.editSite(token, buyer, 'oops'),
      (err) => err.code === 'unauthorized_edit',
      'non‑owner edit rejected'
    );
    evidence({ step: 'unauthorized_edit', token, editor: buyer });

    // Attempt sale with insufficient payment
    assert.throws(
      () => mock.sellToken(token, buyer, price - 10),
      (err) => err.code === 'payment_failed',
      'payment validation rejects under‑payment'
    );
    evidence({ step: 'payment_failed', token, attemptedAmount: price - 10 });
  });
});