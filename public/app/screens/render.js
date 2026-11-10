// Popcards legacy shared-scope script. Loaded in manifest order.
function render(){
 const sc=S.scr;persist();const shTop=document.querySelector('.sh')?.scrollTop||0;
 const screenChanged=sc!==lastMotionScreen,modalChanged=S.modal!==lastMotionModal;
 $('#ph').innerHTML=`<div class="sys"><b>9:41</b><button class="sys-sound" type="button" data-a="soundtoggle" aria-label="${popSoundOn?'Mute':'Enable'} game sounds" aria-pressed="${popSoundOn}">${popSoundOn?'♫ Sound on':'♩ Sound off'}</button><span>Wi-Fi　▰</span></div><div class="ct ${screenChanged?'screen-enter':''}">${V[sc]()}</div>${FOOT.includes(sc)?foot():''}${S.modal&&S.modal!=='prep'?`<div class="ov ${modalChanged?'ov-enter':''}"><div class="sh">${M[S.modal]()}</div></div>`:''}<div id="toast"></div>`;
 PopcardsI18n.translate($('#ph'));
 showToast();S.pop=null;S.sentFlash=false;
 {const sh=document.querySelector('.sh');if(sh&&shTop)sh.scrollTop=shTop}
 // Keep round controls outside the scrolling content so they stay pinned to the phone bottom.
 if(sc==='round'){
  const clock=$('#tm');if(clock&&S.R)clock.textContent=fmt(Math.max(0,S.R.t));
  const phone=$('#ph'), content=phone.querySelector('.ct'), dock=content.querySelector('.round-dock');
  if(dock) phone.insertBefore(dock,content.nextSibling);
 }
 // Keep labeled action buttons text-only; preserve illustrated icons on square icon-only controls.
 const decorativeButtons='#ph button:not(.cp-friend):not(.my-link):not(.nav-tab):not(.journey-level):not(.level-option):not(.tile):not(.study-card):not(.challenge-friend):not(.friends-person):not(.lbx-row):not(.lbx-pod):not(.notif-bell):not(.notif-row):not(.profile-v2-journey):not(.onboard-back):not(.fb-back):not(.profile-v2-settings):not(.friend-profile-close):not(.round-menu-x):not(.prep-v5-close):not(.round-menu-actions button):not(.round-dock button):not(.play-menu button)';
 document.querySelectorAll(decorativeButtons).forEach(button=>{
   // Only strip decorative icons from labeled actions. Keep icons on icon-only
   // buttons, game tiles, navigation controls and interactive illustrations.
   const text=button.textContent.replace(/[→←↗↘➜➝➔➤⟶↪↩]/g,'').trim();
   if(!text || button.getAttribute('aria-label') && !text) return;
   button.querySelectorAll('svg,.prep-v4-arrow,.fb-share-arrow,.friends-chevron,.settings-login-arrow,.login-facebook-icon,.login-google-icon,.fb-f-icon,.fb-share-icon,.settings-login-symbol').forEach(el=>el.remove());
   const walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);
   while(walker.nextNode())walker.currentNode.nodeValue=walker.currentNode.nodeValue.replace(/[→←↗↘➜➝➔➤⟶↪↩]/g,'').replace(/\s{2,}/g,' ');
   button.querySelectorAll('span').forEach(el=>{if(!el.textContent.trim() && !el.children.length)el.remove()});
 });
 if(sc==='results'&&screenChanged&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const el=document.querySelector('.cu'),to=+(el?.dataset.to||0);if(to>0){const t0=performance.now(),tick=n=>{const k=Math.min(1,(n-t0)/800);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(tick)};el.textContent=0;requestAnimationFrame(tick)}}
 window.popcardsApplyButtons?.();
 lastMotionScreen=sc;lastMotionModal=S.modal;
 $('#ph').classList.toggle('motion-correct',sc==='round'&&!!S.R?.fb?.startsWith('Correct!'));
 $('#ph').classList.toggle('motion-wrong',sc==='round'&&!!S.R?.fb?.startsWith('Not a match'));
 const k=J.findIndex(j=>j[1].scr==sc&&(j[1].modal||null)==S.modal);if(k>=0)cur=k;
 $('#side').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',i==cur));
}
function jump(i){window.PopcardsRoundController.stop();cur=i;const j=J[i][1];if(j.run){startRound('solo');return;}
 if(j.scr=='friends'&&j.modal==='friend')S.fp='Mai Nguyen';if(j.modal==='picker'&&!S.authenticated){S.loginReturn='picker';S.scr='login';S.modal=null}else{S.scr=j.scr;S.modal=j.modal||null;}
 if(j.scr!='round'&&j.scr!=='gamerules'){window.PopcardsRoundController.stop()}render();if(j.scr==='splash')scheduleSplash()}
