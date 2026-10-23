'use strict';

// An independent, source-linked demonstration card; not an authorized Cardone Capital service.
const esc = v => String(v ?? '').replace(/[&<>"']/g, x => '&#' + x.charCodeAt(0) + ';');
const COMPANY = 'https://cardonecapital.com/';
const LINKS = Object.freeze({
  opportunities: 'https://cardonecapital.com/',
  portfolio: 'https://cardonecapital.com/investments/',
  disclosures: 'https://cardonecapital.com/disclosures/',
  contact: 'https://cardonecapital.com/contact/'
});
function build(spec = {}) {
  const title = esc(String(spec.title || 'Cardone Capital').slice(0, 90));
  const label = esc(String(spec.agentLabel || 'Bubbles · Real Estate Guide').slice(0, 80));
  const id = esc(String(spec.instanceId || 'cardone-guide').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60));
  const endpoint = String(spec.agentEndpoint || '');
  // Only relative, same-origin, non-protocol URLs can reach a platform-managed Bubbles gateway.
  const agentEndpoint = /^\/(?!\/)[a-zA-Z0-9/_-]{1,180}$/.test(endpoint) ? endpoint : '';
  return `<section class="widgetphi-cardone" data-widgetphi-cardone data-phi-instance="${id}" data-agent-endpoint="${esc(agentEndpoint)}" style="font:inherit;color:#241d1b;background:#f8f3ed;border:1px solid #e9dcd0;border-radius:22px;padding:20px;max-width:640px">
 <p style="font-size:12px;letter-spacing:.12em;color:#9b2925;margin:0 0 6px">REAL ESTATE · VERIFIED SOURCE LINKS</p>
 <h2 style="font-size:28px;margin:0 0 8px">${title}</h2>
 <p style="margin:0 0 16px">Explore the firm's multifamily real estate investments and get help finding official information.</p>
 <div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 18px">
 <a href="${LINKS.opportunities}" target="_blank" rel="noopener noreferrer">Opportunities ↗</a>
 <a href="${LINKS.portfolio}" target="_blank" rel="noopener noreferrer">Real estate portfolio ↗</a>
 <a href="${LINKS.disclosures}" target="_blank" rel="noopener noreferrer">Investment disclosures ↗</a>
 </div>
 <div style="background:white;border:1px solid #e5d5ca;border-radius:16px;padding:14px">
 <h3 style="margin:0 0 8px;font-size:20px">${label}</h3>
 <p style="font-size:13px;margin:0 0 12px">Independent demonstration assistant. Not Cardone Capital's official support or investment adviser.</p>
 <div data-phi-conversation role="log" aria-live="polite" style="max-height:220px;overflow:auto;background:#fffaf5;border-radius:12px;padding:10px">
 <p><strong>Guide:</strong> I can point you toward official investments, risks, and investor contact information.</p>
 </div>
 <form data-phi-question style="display:flex;gap:8px;margin-top:10px">
 <input aria-label="Ask about real estate investing" maxlength="600" placeholder="Ask about real estate..." style="min-width:0;flex:1;padding:11px;border:1px solid #c9b6a6;border-radius:10px" required>
 <button type="submit" style="background:#a52522;color:white;border:0;padding:11px 16px;border-radius:10px">Ask</button></form>
 <p data-phi-status style="font-size:12px;color:#746c67">Information-guide preview · live Bubbles connection not configured.</p>
 <button type="button" data-phi-human style="background:white;border:1px solid #caa9a0;padding:10px 14px;border-radius:10px">Request a human</button>
 <a href="tel:+13054070276" style="margin-left:12px">Call official number ↗</a>
 </div>
 <p style="font-size:12px;line-height:1.5;margin-bottom:0">This is a third-party demonstration, not endorsed by or installed on Cardone Capital. No calls are intercepted or answered by this card. Never enter payment cards, Social Security numbers, account credentials, or financial documents here. Investing involves risk, including loss of principal; offerings and eligibility depend on official documents. <a href="${LINKS.contact}">Official contact</a>.</p>
 </section>`;
}
module.exports = {name:'cardone-capital',build,LINKS,COMPANY};
