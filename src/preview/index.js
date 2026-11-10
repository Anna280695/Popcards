// UI-only fixtures. Loaded exclusively by /?preview; never connects to Supabase.
export function installPreviewData(){
 clearTimeout(splashTimer);
 Object.assign(S,{scr:'leaderboard',modal:null,authenticated:true,playerScore:3280,playerWins:18,
  profile:{...S.profile,name:'Jamie Park',handle:'@jamie.park',avatar:1},
  stats:{rounds:24,pairs:132,mis:17,best:310,perfect:8},
  playedWords:PAIRS.map(p=>[...p]),lastMatchWords:PAIRS.map(p=>[...p]),sel:[],gift:0,
  res:{kind:'complete',mode:'solo',pairs:6,total:6,mis:0,el:34,earned:310,newBest:true},
  inCh:CH_SEED(),weekly:{k:'preview',pts:860}
 });
 const players=[
  {id:'preview-linh',n:'Linh Tran',total:8640,a:3},
  {id:'preview-mai',n:'Mai Nguyen',total:6920,a:2},
  {id:'preview-alex',n:'Alex Chen',total:4750,a:4},
  {id:'preview-you',n:'Jamie Park',total:3280,a:1,you:true},
  {id:'preview-sam',n:'Sam Rivera',total:2140,a:5},
  {id:'preview-noah',n:'Noah Williams',total:960,a:6},
  {id:'preview-ava',n:'Ava Nguyen',total:420,a:7},
  {id:'preview-new',n:'Minh Pham',total:0,a:8}
 ].map(p=>({...p,week:0,you:!!p.you}));
 window.popcardsVerifiedRankings=players;
 window.popcardsVerifiedFriendIds=players.slice(0,5).filter(p=>!p.you).map(p=>p.id);
 window.popcardsRankingsLoaded=true;
 window.popcardsRankingsError=null;
 FR.forEach(f=>{const p=players.find(p=>p.n===f.n);if(p)f.sc=p.total});
 V.friends=()=>`<section class="friends-page"><div class="friends-topbar"><div><span class="friends-eyebrow">YOUR LEARNING CREW</span><h2>Your friends</h2><p>A little friendly competition goes a long way.</p></div></div><div class="online-panel friends-hub-card"><h3>Friends · 4</h3>${FR.map(f=>`<article class="friend-list-card"><span class="friend-list-avatar">${CH(AV[f.n]||1,36)}</span><span class="friend-list-copy"><b>${esc(f.n)}</b><small>${esc(f.h)}</small></span><span class="friend-list-status">${ICON('check',18)}<span>Friends</span></span></article>`).join('')}<div class="friends-subsection"><h4>Incoming request</h4><p class="online-small">Noah Williams · @noah.w</p></div><div class="friends-subsection"><h4>Pending</h4><p class="online-small">Waiting for @ava.nguyen</p></div></div></section>`;
 document.addEventListener('click',e=>{if(e.target.closest('[data-a="challengepicker"]')){S.modal='picker';render()}});
 const note=document.querySelector('#side>p');if(note)note.textContent='Sample data only · changes are not saved to your account.';
 render();
}
installPreviewData();
