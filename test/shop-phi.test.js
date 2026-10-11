'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {handle,list}=require('../src/index');
const shop=require('../src/widgets/shop-phi');
test('Shop Phi composes real curated stores and advertised products, not user preference targeting',()=>{
 assert.ok(list().includes('shop-phi'));
 const c=shop.normalize({title:'My Galaxy Shops',creatorBrand:'Collector Choice',priceStarCoins:1,items:[
  {id:'one',title:'Astronomy art print',merchant:'Creator Store',url:'https://example.org/art/astronomy',kind:'advertisement',sponsored:true,sponsor:'Creator Store',affiliate:true},
  {id:'two',title:'Space telescope',url:'https://example.org/shop/telescope',kind:'product'}
 ]});
 assert.equal(c.creatorBrand,'Collector Choice');assert.equal(c.items.length,2);
 const html=handle({type:'build_widget',widget:'shop-phi',spec:{
  title:'My Galaxy Shops',creatorBrand:'Collector Choice',priceStarCoins:1,
  items:c.items.map(x=>({...x,url:x.url,imageUrl:x.image}))
 }}).html;
 assert.match(html,/Creator-curated|Sponsored/);
 assert.match(html,/Sponsored · Creator Store/);
 assert.match(html,/Affiliate link/);
 assert.match(html,/Astronomy art print/);
 assert.doesNotMatch(html,/Space telescope/,'paid second selection must not leak in source HTML');
 assert.match(html,/disabled aria-disabled="true"/);
 assert.match(html,/Next curated pick · 1 StarCoin/);
 assert.doesNotMatch(html,/fetch\(|wallet\.mint|payment\(\)/);
});
test('Shop Phi escapes titles and refuses unsafe, duplicate or unsupported source URLs',()=>{
 const c=shop.normalize({items:[
  {title:'<img onerror="alert(1)">',url:'https://example.org/shop/item'},
  {title:'duplicate',url:'https://example.org/shop/item'},
  {title:'unsafe',url:'javascript:alert(1)'},
  {title:'local',url:'https://localhost/item'},
  {title:'anything',url:'http://example.org/item'}]});
 assert.equal(c.items.length,1);
 const html=shop.build({items:c.items});
 assert.doesNotMatch(html,/<img onerror=/);
 assert.match(html,/&#60;img/);
 assert.throws(()=>shop.normalize({priceStarCoins:-1}),/0–100 whole StarCoins/);
});
test('Shop Phi does not invent product prices or sponsorship',()=>{
 const v=shop.normalize({items:[{title:'Real source',url:'https://example.com/catalog'}]});
 assert.equal(v.items[0].priceLabel,'');
 assert.equal(v.items[0].sponsored,false);
 assert.match(shop.build({items:v.items}),/not a paid placement/);
});
