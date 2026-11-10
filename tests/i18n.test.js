import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../public/app/i18n.js',import.meta.url),'utf8');
function load(saved=null){const stored=new Map(saved?[['popcards.appLanguage.v1',saved]]:[]);const document={documentElement:{lang:'en'}};const context={window:{},document,localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},Intl,navigator:{language:'vi-VN'}};vm.runInNewContext(source,context);return {api:context.window.PopcardsI18n,document,stored};}
test('defaults to English',()=>{assert.equal(load().api.get(),'en')});
test('suggests Vietnamese from Vietnam locale',()=>{assert.equal(load().api.deviceLanguage('en-VN'),'vi')});
test('suggests Thai from Thailand locale',()=>{assert.equal(load().api.deviceLanguage('th-TH'),'th')});
test('saved selection overrides regional suggestion',()=>{const x=load('fr');assert.equal(x.api.get(),'fr');assert.equal(x.api.choices()[1].code,'vi')});
test('selection updates document language and storage',()=>{const x=load();x.api.set('vi');assert.equal(x.document.documentElement.lang,'vi');assert.equal(x.stored.get('popcards.appLanguage.v1'),'vi')});
test('unsupported language falls back to English',()=>{const x=load();x.api.set('zz');assert.equal(x.api.get(),'en')});
test('expanded Vietnamese translations cover gameplay and social labels',()=>{const x=load();x.api.set('vi');for(const key of ['Ready for a match?','Find the matching pairs','Challenge sent!','No words yet','Copy invite link','Your learning adventure'])assert.notEqual(x.api.t(key),key,key)});
test('additional language translations cover gameplay actions',()=>{for(const language of ['th','es','fr','ja','ko','zh','de']){const x=load();x.api.set(language);for(const key of ['How to play','Resume match','Continue with Google','Challenge sent!'])assert.equal(x.api.has(key),true,`${language}: ${key}`)}});
test('untranslated keys fall back without changing player text',()=>{const x=load();x.api.set('ja');assert.equal(x.api.t('unrecognized player supplied word'),'unrecognized player supplied word');assert.equal(x.api.has('unrecognized player supplied word'),false)});
test('translation diagnostics disclose missing translation coverage',()=>{const x=load();x.api.set('de');const report=x.api.coverage();assert.equal(report.locale,'de');assert.ok(report.translated>35);assert.ok(Array.isArray(report.missing))});
