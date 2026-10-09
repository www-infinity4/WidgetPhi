'use strict';
// Seasonal Halloween cards for TerriPhi + PetriPhi. No credit is minted in the browser.
const esc = x => String(x ?? '').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const clean = (x,n=180) => String(x ?? '').replace(/\s+/g,' ').trim().slice(0,n);
const MODES=['game','video','sound','art','story','costume','vintage'];
function https(raw) { try { const u=new URL(String(raw||'')); return u.protocol==='https:'?u.href:''; } catch { return ''; } }
function build(spec={}) {
 const mode=MODES.includes(spec.mode)?spec.mode:'game';
 const title=clean(spec.title||({game:'Haunted Door Hunt',video:'Halloween Screening',sound:'Spooky Sound Lab',art:'PetriPhi Art Studio',story:'Spooky Story Starters',costume:'Costume Mashup',vintage:'Vintage Halloween'})[mode],90);
 const desc=clean(spec.description||'A little Halloween magic from the Phi universe.',230);
 const video=require('./video-feed').media(spec.videoUrl||'');
 const image=https(spec.imageUrl),art=https(spec.artUrl);
 const actions={
  game:'<div class="ph-activity"><button data-ph-action="door">🚪 Door 1</button><button data-ph-action="door">🚪 Door 2</button><button data-ph-action="door">🚪 Door 3</button></div>',
  video:video?'<button data-ph-action="video" data-ph-embed="'+esc(video.embed)+'">▶ Watch '+esc(video.provider)+'</button>':'<p>Add a real YouTube, Vimeo or Internet Archive film link.</p>',
  sound:'<button data-ph-action="sound">♫ Play spooky sound</button><button data-ph-action="stop">Stop</button>',
  art:art?'<a href="'+esc(art)+'">🎨 Open PetriPhi Studio ↗</a>':'<p>Connect the live PetriPhi art-studio address to activate.</p>',
  story:'<button data-ph-action="story">✦ Reveal story starter</button>',
  costume:'<button data-ph-action="costume">🎭 Mix a costume</button>',
  vintage:image?'<figure><img src="'+esc(image)+'" loading="lazy" alt="'+esc(title)+'"><figcaption>'+esc(clean(spec.imageCredit||'Rights/credit must be verified',180))+'</figcaption></figure>':'<p>Add a rights-cleared vintage image and credit.</p>'
 };
 const id=clean(spec.id||'seasonal-'+mode,70).replace(/[^a-zA-Z0-9_-]/g,'-');
 return '<section class="widgetphi-seasonal" data-widgetphi-seasonal data-ph-id="'+esc(id)+'" data-ph-mode="'+esc(mode)+'" data-ph-seasonal="'+(spec.seasonal===false?'0':'1')+'" data-ph-popup="'+(spec.popup===true?'1':'0')+'" aria-label="'+esc(title)+'">'+
 '<style>.widgetphi-seasonal{box-sizing:border-box;background:radial-gradient(circle at 88% 0%,#653877,#1a0d28 70%);color:#fff6df;border:2px solid #bc86fe;border-radius:18px;box-shadow:0 0 25px #8f3ded44;padding:18px;max-width:580px;min-width:0;font:500 16px/1.5 system-ui,sans-serif}.widgetphi-seasonal *{box-sizing:border-box}.widgetphi-seasonal h2{font-size:clamp(23px,5vw,32px);line-height:1.12;margin:5px 0 10px}.widgetphi-seasonal p{margin:8px 0 13px}.widgetphi-seasonal .ph-heading{font-size:12px;letter-spacing:.13em;color:#ffe39a;font-weight:800}.widgetphi-seasonal .ph-activity,.widgetphi-seasonal .ph-actions{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}.widgetphi-seasonal button,.widgetphi-seasonal a{font:700 14px system-ui,sans-serif;white-space:normal;overflow-wrap:anywhere;text-align:center;color:#fffbe8;background:#512570;border:1px solid #edbc72;border-radius:12px;padding:10px 13px;min-width:0;min-height:42px;cursor:pointer;text-decoration:none}.widgetphi-seasonal button:hover,.widgetphi-seasonal a:hover{background:#8539ae}.widgetphi-seasonal button:focus-visible,.widgetphi-seasonal a:focus-visible{outline:3px solid #ffca4d;outline-offset:3px}.widgetphi-seasonal .ph-close{float:right;padding:4px 9px;min-height:28px}.widgetphi-seasonal .ph-result{min-height:26px;color:#ffe39a}.widgetphi-seasonal img{max-width:100%;max-height:300px;object-fit:contain}@media(prefers-reduced-motion:reduce){.widgetphi-seasonal *{animation:none!important;transition:none!important}}</style>'+
 '<button type="button" class="ph-close" data-ph-action="close" aria-label="Dismiss seasonal card">×</button><div class="ph-heading">HALLOWEEN · '+esc(mode.toUpperCase())+' · PHI</div><h2>'+esc(title)+'</h2><p>'+esc(desc)+'</p>'+actions[mode]+
 '<p class="ph-result" role="status" aria-live="polite"></p><div class="ph-actions"><button data-ph-action="star">☆ Star</button><button data-ph-action="share">Share</button><button data-ph-action="collect">Collect</button></div></section>';
}
module.exports={name:'seasonal-card',MODES,build};