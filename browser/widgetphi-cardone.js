/* Cardone source-linked demo; optional same-origin authorized Bubbles endpoint. */
(function(){
  'use strict';
  const links={
    opportunities:'https://cardonecapital.com/westshoresouth/',
    portfolio:'https://cardonecapital.com/investments/',
    disclosures:'https://cardonecapital.com/disclosures/',
    contact:'https://cardonecapital.com/contact/'
  };
  function guide(q){
    const s=q.toLowerCase();
    if(/(fee|risk|guarante|return|loss|safe|cashflow|liquid)/.test(s))return 'Returns are not guaranteed, investments can be illiquid and loss of principal is possible. Review the official disclosures: '+links.disclosures;
    if(/(bitcoin|btc|hybrid)/.test(s))return 'The company describes real-estate-only and real-estate-plus-Bitcoin strategies. Bitcoin is speculative. Compare the official materials: '+links.opportunities;
    if(/(westshore|tampa|608|cashflow|cash flow|acres|bay)/.test(s))return '10X Westshore South has 608 residences on approximately 52 acres near Old Tampa Bay, according to the official page. Targeted cashflow is not guaranteed. Property: https://cardonecapital.com/westshoresouth/ . Read current offering documents before investing.';
    if(/(property|portfolio|unit|apartment|rental|asset)/.test(s))return 'View the property portfolio at '+links.portfolio+' for the company\'s own current details.';
    if(/(accredit|eligible|minimum|ira|401|invest|offering|ppm)/.test(s))return 'Investor eligibility and offering terms vary. Refer to official documents and independent advice: '+links.disclosures;
    if(/(human|agent|call|phone|representative|schedule|talk)/.test(s))return 'For a real representative, use Cardone Capital\'s published contact details: '+links.contact+'. This preview cannot transfer or receive calls.';
    return 'I can help navigate opportunities, the property portfolio, investment risks, and contacting investor relations. Official details: '+links.opportunities;
  }
  function message(log,who,text){
    const p=document.createElement('p'),b=document.createElement('strong');
    b.textContent=who+': ';p.appendChild(b);p.appendChild(document.createTextNode(text));
    log.appendChild(p);log.scrollTop=log.scrollHeight;
  }
  async function submit(root,form){
    const input=form.querySelector('input'),status=root.querySelector('[data-phi-status]'),log=root.querySelector('[data-phi-conversation]');
    const q=input.value.trim();if(!q)return;
    input.value='';message(log,'You',q);
    const endpoint=root.dataset.agentEndpoint;
    if(!endpoint){message(log,'Guide',guide(q));return;}
    if(!/^\/(?!\/)[a-zA-Z0-9/_-]{1,180}$/.test(endpoint)){status.textContent='Untrusted agent endpoint rejected.';return;}
    // Consent is required before sending a visitor's message to a configured platform AI.
    if(root.dataset.aiConsented!=='yes'){
      const yes=window.confirm('Send your message to the platform Bubbles AI service? Do not share payment, identity or account details.');
      if(!yes){message(log,'Guide',guide(q));return;}
      root.dataset.aiConsented='yes';
    }
    const btn=form.querySelector('button');btn.disabled=true;status.textContent='Contacting Bubbles...';
    try{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      let response;
      try{response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({agent:'cardone-real-estate',instanceId:root.dataset.phiInstance,message:q}),signal:controller.signal});}
      finally{clearTimeout(timer);}
      if(!response.ok)throw Error('Service unavailable');
      const data=await response.json();
      if(!data||typeof data.answer!=='string'||!data.answer.trim())throw Error('No valid reply');
      message(log,'Bubbles',data.answer.slice(0,1800));
      status.textContent='Response received from connected platform endpoint.';
    }catch{
      message(log,'Guide',guide(q));
      status.textContent='Live AI unavailable; showing a source-linked local guide answer.';
    }finally{btn.disabled=false;}
  }
  document.addEventListener('submit',e=>{
    const form=e.target.closest('[data-phi-question]');if(!form)return;
    const root=form.closest('[data-widgetphi-cardone]');if(!root)return;
    e.preventDefault();submit(root,form);
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-phi-human]');if(!b)return;
    const root=b.closest('[data-widgetphi-cardone]');if(!root)return;
    message(root.querySelector('[data-phi-conversation]'),'Guide','The live transfer switchboard is not connected. Please use the official Cardone Capital contact page: '+links.contact);
    root.dispatchEvent(new CustomEvent('phi:cardone:human-request',{bubbles:true,detail:{instanceId:root.dataset.phiInstance,status:'not_connected'}}));
  });
})();
