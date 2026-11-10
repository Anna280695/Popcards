// Popcards legacy shared-scope script. Loaded in manifest order.
document.addEventListener('click',e=>{
 // Online dialogs handle their own actions; redrawing here detaches the popup.
 if(e.target.closest('#online-modal, [data-online]'))return;
 if(e.target.closest('.settings-field select, .settings-field .onboard-select-wrap'))return;
 if(e.target.classList?.contains('ov')){if(S.modal==='rules'&&S.rulesFrom==='menu'){S.modal='menu';S.rulesFrom=null;render();return}if(S.pickerDone)return finishSend();S.modal=null;S.pfDraft=null;render();return}
 const el=e.target.closest('[data-a]');if(el){const a=el.dataset.a,v=el.dataset.v;

 if(a=='soundtoggle'){setSound(!popSoundOn);return}
 if(a==='resultnav'){e.preventDefault();sfx('tap');window.PopcardsRoundController.stop();S.modal=null;S.scr=v==='profile'?'profile':'leaderboard';render();return}
 if(['go','modal','close','flashnext','flashprev','flashstart','start','node','friend','wordselect','wordinfo','playfromrules','openrules','closerules'].includes(a))sfx('tap');
 if(a=='onboardlogin'){S.authenticated=true;S.scr=S.loginReturn==='settings'?(S.settingsReturn||'profile'):S.loginReturn==='picker'?'results':(S.loginReturn||'profile');S.modal=S.loginReturn==='settings'?'settings':S.loginReturn==='picker'?'picker':null;S.loginReturn='profile';toast('Signed in for this demo')}
 else if(a=='loginback'){S.scr=S.loginReturn==='settings'?(S.settingsReturn||'profile'):(S.loginReturn==='picker'?'results':'profile');S.modal=S.loginReturn==='settings'?'settings':null}
 else if(a=='requirelogin'){if(v==='settings')S.settingsReturn=S.scr;S.loginReturn=v||'profile';S.scr='login';S.modal=null}
 else if(a=='logout'){S.authenticated=false;S.scr='profile';S.modal='settings';toast('Logged out — you can keep learning as a guest')}
 else if(a=='saveSettings'){PopcardsI18n.set($('#settings-app-lang')?.value||PopcardsI18n.get());S.learningLanguage=$('#settings-learn-lang')?.value||S.learningLanguage;S.definitionLanguage=$('#settings-define-lang')?.value||S.definitionLanguage;S.modal=null;toast('Learning preferences saved')}
 else if(a=='saveLanguages'){S.learningLanguage=$('#learn-lang')?.value||'English';S.definitionLanguage=$('#define-lang')?.value||'Vietnamese';startRound('solo');S.modal=null}

 else if(a=='go'){if(S.scr==='prematch')window.PopcardsRoundController.stop();if(v==='picker'){if(!S.authenticated){S.loginReturn='picker';S.scr='login';S.modal=null}else{S.sel=S.sel.filter(n=>!(S.res?.challenged||[]).includes(n));S.modal='picker'}}else if(v==='gamerules'){S.scr='playhome';S.modal='rules'}else{S.scr=(v==='round'&&!S.R)?'playhome':(V[v]?v:'playhome');S.modal=null;if(v!='round'){window.PopcardsRoundController.stop()}}}
 else if(a=='openrules'){S.rulesFrom=S.modal;S.modal='rules'}
 else if(a=='closerules'){S.modal=S.rulesFrom==='menu'?'menu':null;S.rulesFrom=null}
 else if(a=='rulesback'){S.scr=S.rulesReturn==='round'?'round':(S.rulesReturn||'review');S.modal=null}
 else if(a=='modal'){S.modal=v;if(v==='fb')S.msg='';}
 else if(a=='close'){if(S.modal==='rules'&&S.rulesFrom==='menu'){S.modal='menu';S.rulesFrom=null;render();return}if(S.pickerDone){clearTimeout(doneTimer);S.pickerDone=null;S.sentFlash=true}S.modal=null;S.pfDraft=null}
 else if(a=='node'){startRound('solo')}
 else if(a=='inbox'){if(S.ch)S.scr='friends';else return toast('No challenges yet — challenge a friend from Play & words')}
 else if(a=='wordinfo'){S.wordDetailIndex=+v;S.modal='worddetail'}
 else if(a=='speak'){if(!('speechSynthesis' in window))return toast('Pronunciation unavailable on this device');window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(v);u.lang='en-US';u.rate=.85;window.speechSynthesis.speak(u);return}
 else if(a=='wordselect'){const i=+v;S.selectedWords=S.selectedWords.includes(i)?S.selectedWords.filter(x=>x!==i):[...S.selectedWords,i].sort((a,b)=>a-b)}
 else if(a=='togglewords')S.selectedWords=S.selectedWords.length===S.playedWords.length?[]:S.playedWords.map((_,i)=>i);
 else if(a=='dueReview'){startDueReview()}
 else if(a=='reviewRate'){sfx(v==='known'?'reward':'wrong');const w=S.playedWords[S.selectedWords[S.flashIndex]]?.[0];if(w)rateReview(w,v==='known');const due=reviewWords();if(!due.length){S.reviewMode=false;S.scr='review';toast('Review complete!')}else{S.selectedWords=due.map(p=>S.playedWords.findIndex(q=>q[0]===p[0])).filter(i=>i>=0);S.flashIndex=0;S.flashFlipped=false;toast(v==='known'?'Scheduled for later':'Added back to review')} }
 else if(a=='flashstart'){S.reviewMode=false;if(S.selectedWords.length<1)return toast('Select at least one word to practice');S.flashIndex=0;S.flashFlipped=false;S.scr='flashcards'}
 else if(a=='flipflash'){sfx('flip');S.flashFlipped=!S.flashFlipped;S.flashAnim=true}
 else if(a=='flashprev'){S.flashIndex=Math.max(0,S.flashIndex-1);S.flashFlipped=false}
 else if(a=='flashnext'){S.flashIndex=(S.flashIndex+1)%S.selectedWords.length;S.flashFlipped=false}
 else if(a=='playfromrules'){S.modal=null;startRound('solo')}
 else if(a=='start'){if(v==='words-match'&&S.selectedWords.length<2)return toast('Select at least two words to match');startRound(v)}
 else if(a=='tile'){
  const action=window.PopcardsRoundController.select(+v);
  if(!action.accepted)return;
  sfx('flip');
  if(action.type==='match')sfx(S.R.combo>1?'combo':'correct');
  if(action.type==='miss')sfx('wrong');
 }
 else if(a=='clue'){const R=S.R;if(!R||R.mode==='challenge')return toast('Helpers are disabled in scored challenges');if(R.busy||R.cluePending)return;if(clueBalance()<1)return toast('No clues left. '+clueResetLabel());const t=R.t_.findIndex(x=>!x.d);if(t<0)return;
 R.cluePending=true;takeClue().then(ok=>{R.cluePending=false;if(!ok){R.clue=clueBalance();toast('No clues left. '+clueResetLabel());render();return}if(S.R!==R||S.scr!=='round')return;sfx('reward');R.clue=clueBalance();window.PopcardsRoundController.useClue();render()}).catch(err=>{R.cluePending=false;toast('Could not use clue: '+err.message);render()});}
 else if(a=='end')return finish('ended');
 else if(a=='sel'){const k=S.sel.indexOf(v);k<0?S.sel.push(v):S.sel.splice(k,1);S.pop=v;if(fitGift())toast('Gift lowered to fit your balance')}
 else if(a=='create'){if(!S.sel.length)return toast('Choose at least one friend');fitGift();const gift=S.gift,cost=gift*S.sel.length;if(cost>S.playerScore)return toast('Not enough points for this gift');S.playerScore-=cost;S.challengeUnlocked=true;S.ch={f:[...S.sel],gift,cost,done:false,target:S.res?.earned||S.stats.best||0,words:S.lastMatchWords||[],sentAt:Date.now()};addNotif({t:'system',txt:'Challenge sent to '+nameList(S.ch.f),sub:'They have 24h to play your words',ago:'Just now'});if(S.res)S.res.challenged=[...(S.res.challenged||[]),...S.ch.f];S.pickerDone={f:[...S.ch.f],gift,cost};S.modal='picker';clearTimeout(doneTimer);doneTimer=setTimeout(finishSend,1800);S.sel=[];S.gift=0}
 else if(a=='gift'){S.gift=+v;S.pop='g'+v}
 else if(a=='selall'){{const av=FR.filter(f=>!(S.res?.challenged||[]).includes(f.n)).map(f=>f.n);S.sel=S.sel.length===av.length?[]:av}if(fitGift())toast('Gift lowered to fit your balance')}
 else if(a=='friend'){S.fp=v;S.modal='friend'}
 else if(a=='challengefriend'){if(!S.authenticated){S.loginReturn='friends';S.scr='login';S.modal=null}else if(!S.playedWords.length)toast('Play a match first, then challenge '+v.split(' ')[0]);else{S.sel=[v];S.modal='picker'}}
 else if(a=='fbcopymessage'){if(!/^https?:$/.test(location.protocol))return toast('Publish Popcards online to copy an invite link');const message=location.href;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(message).then(()=>toast('Invite link copied!')).catch(()=>toast('Unable to copy in this browser'));else{const t=document.createElement('textarea');t.value=message;t.style.cssText='position:fixed;opacity:0';document.body.appendChild(t);t.select();let okc=false;try{okc=document.execCommand('copy')}catch(e){}t.remove();toast(okc?'Invite link copied!':'Clipboard not available in this browser')}return}
 else if(a=='chcopy'){if(!/^https?:$/.test(location.protocol))return toast('Publish Popcards online to copy a challenge link');const message=location.href;const done=()=>toast('Challenge link copied!');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(message).then(done).catch(()=>toast('Unable to copy in this browser'));else{const t=document.createElement('textarea');t.value=message;t.style.cssText='position:fixed;opacity:0';document.body.appendChild(t);t.select();let okc=false;try{okc=document.execCommand('copy')}catch(e){}t.remove();okc?done():toast('Clipboard not available in this browser')}return}
 else if(a=='chfb'){if(!/^https?:$/.test(location.protocol))return toast('Host this prototype online to share on Facebook');window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(location.href),'_blank','noopener,noreferrer');return}
 else if(a=='fbshare'){if(!/^https?:$/.test(location.protocol))return toast('Host this prototype online to share on Facebook');window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(location.href),'_blank','noopener,noreferrer');return}
 
 else if(a=='editprofile'){S.pfDraft={...S.profile};S.modal='editprofile'}
 else if(a=='avatar'){S.pfDraft={...(S.pfDraft||S.profile),name:$('#pf-name')?.value??S.profile.name,handle:$('#pf-handle')?.value??S.profile.handle,avatar:+v}}
 else if(a=='saveprofile'){const name=($('#pf-name')?.value||'').trim().replace(/\s+/g,' ');let h=($('#pf-handle')?.value||'').trim().toLowerCase();if(!name)return toast('Enter a display name');if(!/^@?[a-z0-9._]{3,20}$/.test(h))return toast('Username: 3–20 letters, numbers, . or _');if(!h.startsWith('@'))h='@'+h;S.profile={name,handle:h,avatar:(S.pfDraft||S.profile).avatar};S.pfDraft=null;S.modal=null;toast('Profile updated')}
 else if(a=='toast')return toast(v);
  else if(a=='lbscope')S.lbScope=v;
  else if(a=='lbperiod')S.lbPeriod=v;
  else if(a=='notif'){S.notifFrom=['friends','profile','leaderboard'].includes(S.scr)?S.scr:'friends';S.scr='notifications';S.modal=null}
  else if(a=='notifopen'){const x=S.notifs.find(o=>String(o.id)===v);if(x){x.read=true;if(x.a==='go'){S.scr=x.v;S.modal=null}else if(x.a==='start')startRound(x.v);else if(x.a==='playch'){S.activeCh=+x.v;startRound('challenge')}else if(x.a==='friend'){S.scr='friends';S.fp=x.v;S.modal='friend'}}}
  else if(a=='notifreadall'){if(unread())S.notifs.forEach(x=>x.read=true);else S.notifs=[]}
  else if(a=='playch'){const c=S.inCh.find(x=>String(x.id)===v);if(c){S.activeCh=c.id;startRound('challenge')}}
  else if(a=='notifpref'){S.notifPrefs[v]=S.notifPrefs[v]===false}
  else if(a=='addfriend'){if(!S.authenticated){S.loginReturn='friends';S.scr='login';S.modal=null}else if(!S.friendReq.includes(v)){S.friendReq.push(v);addNotif({t:'friend',txt:'Friend request sent to '+v,sub:'We’ll let you know when they accept',a:'friend',v});toast('Friend request sent to '+v.split(' ')[0]);persist()}}
 else if(a=='addfr'){let u=($('#un')?.value||'').trim().toLowerCase();const own=S.profile.handle;
  S.msg=!u?'Enter a username to send a request':!/^@?[a-z0-9._]{3,}$/.test(u)?'Invalid username':(u=u.startsWith('@')?u:'@'+u)==own?'That’s your own username':(S.names.includes(u)||FR.some(x=>x.h===u))?'You’re already connected or requested':(S.names.push(u),'Friend request sent to '+u)}
 }
 render();});
document.addEventListener('keydown',e=>{if(S.scr==='flashcards'&&!S.modal&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){document.querySelector(e.key==='ArrowLeft'?'[data-a=flashprev]':'[data-a=flashnext]')?.click();return}if(e.key==='Escape'&&S.modal){if(S.pickerDone)return finishSend();S.modal=null;render()}});
if(new URLSearchParams(location.search).has('preview'))document.getElementById('side').innerHTML='<h1>Popcards · Screen explorer</h1><p>Preview individual screens.</p>'+J.map((j,i)=>`<button data-j="${i}">${j[0]}</button>`).join('');
$('#side').addEventListener('click',e=>{const b=e.target.closest('[data-j]');if(b)jump(+b.dataset.j)});
render();
scheduleSplash();
