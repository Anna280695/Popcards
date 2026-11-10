/* Popcards online integration; isolated service modules own data fetching. */
import {createChallengeRound} from './services/challenge-session.js';
import {loadSocialData, acceptedFriendIds, findPerson, subscribeToSocial} from './services/social.js';
import {fetchVerifiedRankings} from './services/rankings.js';
import {getClueAllowance, consumeServerClue} from './services/clues.js';
import {loadOptionalFeature, setupMessage} from './services/setup.js';
import {renderChallengeResult} from './ui/challenge-result.js';
import {escapeHtml} from './ui/escape.js';
(()=>{
const url=window.POPCARDS_SUPABASE_URL,key=window.POPCARDS_SUPABASE_ANON_KEY;
const configured=!!(url&&key&&window.supabase);
const db=configured?window.supabase.createClient(url,key):null;
let me=null,profile=null,people=[],requests=[],challenges=[],live=null,activeOnlineChallenge=null,pendingSubmission=null;
window.popcardsConsumeClue=null;window.popcardsClueBalance=undefined;window.popcardsClueResetAt=null;
let clueResetTimer=null;
function scheduleClueReset(at){
 clearTimeout(clueResetTimer);
 if(!at)return;
 const delay=Math.max(0,Date.parse(at)-Date.now());
 if(!Number.isFinite(delay))return;
 clueResetTimer=setTimeout(()=>refreshClueBalance().catch(console.error),Math.min(delay+100,2147483647));
}
function updateClueState(row){window.popcardsClueBalance=row.remaining;window.popcardsClueResetAt=row.reset_at;if(S.R&&S.R.mode!=='challenge')S.R.clue=row.remaining;scheduleClueReset(row.reset_at);}
async function refreshClueBalance(){
 if(db&&me)await reloadClues();else updateClueState(localClueState());
 render();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshClueBalance().catch(console.error)});
window.addEventListener('online',()=>refreshClueBalance().catch(console.error));
async function reloadClues(){if(!db||!me)return;const row=await getClueAllowance(db);if(row)updateClueState(row);}
window.popcardsConsumeClue=async function(){if(!db||!me){const state=localClueState();if(!state.remaining)return false;if(!state.reset_at)state.reset_at=new Date(Date.now()+CLUE_WINDOW).toISOString();state.remaining--;localStorage.setItem(CLUE_KEY,JSON.stringify(state));updateClueState(state);return true;}const row=await consumeServerClue(db);updateClueState(row);return row.consumed;};
const safe=escapeHtml;
const $=sel=>document.querySelector(sel);
function notice(s){if(typeof toast==='function')toast(s);else alert(s)}
function overlay(html){document.querySelector('#online-modal')?.remove();const n=document.createElement('div');n.id='online-modal';n.className='online-backdrop';n.innerHTML=`<div class="online-sheet" role="dialog" aria-modal="true" aria-label="Online Popcards"><button type="button" class="online-close" data-online="close" aria-label="Close">×</button>${html}</div>`;$('#ph').append(n);window.popcardsApplyButtons?.()}
function challengeWords(){return (S.lastMatchWords||[]).filter(x=>Array.isArray(x)&&x.length===2).slice(0,6)}
function alreadyChallenged(id){
 const key=pairs=>JSON.stringify((pairs||[]).map(pair=>JSON.stringify([...pair].sort())).sort());
 const current=key(challengeWords());
 return challenges.some(c=>c.sender_id===me?.id&&c.receiver_id===id&&key(c.pairs)===current);
}
let selectedChallengePlayers=new Set();
function challengePicker(){
 selectedChallengePlayers.clear();
 const friends=me?friendList():[],words=challengeWords();
 overlay(`<section class="challenge-select"><div class="mascot-popup-heading"><div><span class="challenge-kicker">PLAY TOGETHER</span><h2>Challenge a friend</h2></div><span aria-hidden="true">${CH(22,82)}</span></div><p>${words.length>=2?'Select friends to play the words from your last round.':'Play a round first, then send the same words to a friend.'}</p>${words.length<2?`<button class="act" data-online="challenge-round">Play a round</button>`:''}${me&&words.length>=2?`<div class="challenge-select-list">${friends.map(x=>`<button type="button" class="challenge-select-person ${alreadyChallenged(x.id)?'is-sent':''}" data-online="pick-challenge" aria-pressed="false" data-id="${safe(x.id)}" ${alreadyChallenged(x.id)?'disabled':''}><span>${ICON('friends',30)}</span><span><b>${safe(x.display_name)}</b><small>@${safe(x.username)}</small></span>${alreadyChallenged(x.id)?'<span class="challenge-sent-badge"><span aria-hidden="true">✓</span> Sent</span>':'<span class="challenge-selection-check" aria-hidden="true">✓</span>'}</button>`).join('')}</div>${friends.length?'<button class="act challenge-selection-next" data-online="send-selected-challenges">Send challenge</button><p class="online-error" id="challenge-error" role="alert"></p>':''}`:''}${!me||!friends.length?`<p class="challenge-select-empty">${me?'Add a friend to start your first challenge.':'Sign in to send and receive friend challenges.'}</p><button class="online-outline" data-online="${me?'friends':'login'}">${me?'Find friends':'Sign in'}</button>`:''}<div class="challenge-select-share"><p>Bring someone new to Popcards</p><button type="button" class="online-outline" data-online="share-invite">Share app invite</button><small>This invites them to the app. Add each other as friends to challenge.</small></div></section>`);
}
function toggleChallengePlayer(id,button){
 if(button.disabled)return;
 if(selectedChallengePlayers.has(id))selectedChallengePlayers.delete(id);else selectedChallengePlayers.add(id);
 button.setAttribute('aria-pressed',String(selectedChallengePlayers.has(id)));
 const next=$('[data-online="send-selected-challenges"]');
 if(next){next.textContent=selectedChallengePlayers.size?'Send challenge · '+selectedChallengePlayers.size+' selected':'Send challenge'}
}
function reviewChallenge(value){
 const ids=[...new Set(value.split(',').filter(Boolean))];
 if(!me)return signin();
 if(!ids.length||ids.some(id=>!friendIds().includes(id)))return notice('Choose accepted friends');
 if(challengeWords().length<2)return challengePicker();
 if(ids.some(alreadyChallenged))return notice('This match has already been sent to one of these friends. Choose other players.');
 const names=ids.map(id=>person(id).display_name).join(', ');
 overlay(`<section class="challenge-select"><span class="challenge-kicker">READY TO SEND?</span><h2>${ids.length===1?'Challenge '+safe(names):'Challenge '+ids.length+' friends'}</h2>${ids.length>1?`<p class="challenge-recipient-names">${safe(names)}</p>`:''}<p>They’ll play the same words from your last round, with one attempt to beat your score.</p><div class="challenge-summary"><strong>${Math.max(0,Math.round(S.res?.earned||0)).toLocaleString()} points to beat</strong><span>${challengeWords().length} pairs · 30 seconds · No clues</span><span>They have 24 hours to play.</span></div><p class="online-error" id="challenge-error" role="alert"></p><button class="act" data-online="send-challenge" data-id="${safe(ids.join(','))}">Send challenge</button></section>`);
}
let sendingChallenge=false;
async function sendChallenge(id,button){
 if(sendingChallenge)return;
 sendingChallenge=true;
 try{
 const ids=[...new Set(id.split(',').filter(Boolean))],words=challengeWords();
 if(!ids.length)throw new Error('Select at least one player to send a challenge');
 if(!me||ids.some(player=>!friendIds().includes(player)))throw new Error('Choose accepted friends');
 if(words.length<2)throw new Error('Play a match first');
 if(ids.some(alreadyChallenged))throw new Error('This match has already been sent to one of these friends');
 const target=Math.max(0,Math.round(S.res?.earned||0));
 const response=await db.from('challenges').insert(ids.map(receiver_id=>({sender_id:me.id,receiver_id,pairs:words,target_score:target}))).select();
 if(response.error)throw response.error;
 challenges.unshift(...response.data);refresh().catch(console.error);
 const names=ids.map(player=>person(player).display_name).join(', ');
 overlay(`<section class="challenge-select challenge-success"><div class="popup-success-mascot" aria-hidden="true">${CH(20,110)}</div><h2>Challenge sent!</h2><p>${safe(names)} ${ids.length===1?'has':'have'} 24 hours to play your words. They’ll find your challenge in their Profile.</p></section>`)}
 catch(error){const message=$('#challenge-error');if(message)message.textContent=errorMessage(error);button.textContent='Send challenge'}
 finally{sendingChallenge=false}
}
function challengeInbox(){
 if(!me)return '';
 const now=Date.now(),received=challenges.filter(c=>c.receiver_id===me.id);
 const incoming=received.filter(c=>c.status==='pending'&&Date.parse(c.expires_at)>now);
 const history=received.filter(c=>c.status==='completed'||Date.parse(c.expires_at)<=now);
 const row=c=>{
  const ready=c.status==='pending'&&Date.parse(c.expires_at)>now,other=person(c.sender_id),completed=c.status==='completed';
  const hours=Math.max(1,Math.ceil((Date.parse(c.expires_at)-now)/3600000));
  const result=completed?(c.response_score>c.target_score?'You won':c.response_score===c.target_score?'Tied':'Completed'):'Expired';
  const subtitle=ready?`Beat ${c.target_score} pts · ${hours}h left`:completed?`${result} · ${c.response_score??0} vs ${c.target_score} pts`:'The 24-hour window has ended';
  return `<button type="button" class="my-link challenge-space-card" data-online="${ready?'review-play':'challenge-result'}" data-id="${safe(c.id)}" aria-label="${safe(ready?'Play challenge from '+other.display_name:'View challenge result with '+other.display_name)}">${ICON(ready?'play':completed?'trophy':'clock',31)}<span><b>${safe(other.display_name)}${ready?' challenged you':''}</b><small>${subtitle}</small></span><span class="my-shortcut-chevron">${ready?'›':ICON(completed?'check':'clock',19)}</span></button>`;
 };
 return `<div class="my-v5-section">CHALLENGES FROM FRIENDS${incoming.length?' · '+incoming.length+' NEW':''}</div><div class="my-v4-links challenge-space-links">${incoming.map(row).join('')}${history.map(row).join('')}${!received.length?`<div class="challenge-space-empty">${ICON('friends',31)}<span><b>No challenges yet</b><small>Challenges from your friends will appear here.</small></span></div>`:''}</div>`;
}
window.popcardsProfileChallenges=challengeInbox;
function showChallengeResult(id){
 const c=challenges.find(c=>c.id===id&&c.receiver_id===me?.id);
 if(!c)return notice('Challenge result unavailable');
 if(c.status!=='completed'&&Date.parse(c.expires_at)>Date.now())return reviewIncomingChallenge(id);
 const opponent=person(c.sender_id),ranked=(window.popcardsVerifiedRankings||[]).find(p=>p.id===opponent.id);
 overlay(renderChallengeResult({challenge:c,opponent,you:{display_name:profile?.display_name||S.profile.name},yourAvatar:CH(S.profile.avatar,72),opponentAvatar:CH(ranked?.a||1,72)}));
}
function reviewIncomingChallenge(id){const c=challenges.find(c=>c.id===id&&c.receiver_id===me?.id);if(!c)return;overlay(`<section class="challenge-select"><div class="popup-invite-mascot" aria-hidden="true">${CH(17,90)}</div><h2>Ready to take on ${safe(person(c.sender_id).display_name)}?</h2><p>You get one attempt. The timer starts as soon as you press Play.</p><div class="challenge-summary"><strong>${c.target_score} points to beat</strong><span>${c.pairs.length} pairs · 30 seconds · No clues</span></div><p class="online-error" id="challenge-start-error" role="alert" aria-live="polite"></p><button class="act" data-online="play" data-id="${safe(c.id)}">Play challenge</button></section>`)}
async function shareInvite(){
 const link=new URL(location.pathname,location.origin).href;
 if(navigator.share){try{await navigator.share({title:'Play Popcards with me',text:'Join me on Popcards!',url:link});return}catch(e){if(e.name==='AbortError')return}}
 if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(link);notice('Invite link copied!')}else notice('Sharing is unavailable in this browser');
}
function errorMessage(e){return e?.message||String(e)}
async function call(q){try{await q()}catch(e){notice(errorMessage(e));console.error('Popcards online:',e)}}
function signin(){overlay(`<h2>Popcards account</h2><p>Sign in or create an account to connect with real friends.</p>${!configured?'<p class="online-error">Configure your Supabase URL and publishable key in config.js first.</p>':''}<form id="online-login"><label>Email<input type="email" name="email" required autocomplete="email"></label><label>Password<input type="password" name="password" required minlength="6" autocomplete="current-password"></label><p class="online-error" id="online-login-error" role="alert" aria-live="polite" hidden></p><div class="online-actions"><button class="act" name="auth" value="login" ${!configured?'disabled':''}>Log in</button><button class="online-outline" name="auth" value="signup" ${!configured?'disabled':''}>Create account</button></div></form><button type="button" class="online-text-link" data-online="forgot">Forgot password?</button><p class="online-small">Your account is saved securely with Supabase Auth. Email confirmation may be required.</p>`)}
async function submitLogin(e){e.preventDefault();const form=e.currentTarget,error=$('#online-login-error'),buttons=[...form.querySelectorAll('button')],d=new FormData(form),email=String(d.get('email')||'').trim(),password=String(d.get('password')||''),action=e.submitter?.value||'login';if(error){error.hidden=true;error.textContent=''}buttons.forEach(button=>button.disabled=true);try{const res=action==='signup'?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});if(res.error)throw res.error;if(!res.data.session){overlay(`<h2>Confirm your email</h2><p>We sent a confirmation link to <b>${safe(email)}</b>. Open it, then return here and log in.</p><button class="act" data-online="login">Back to login</button>`);return}$('#online-modal')?.remove();await syncSession()}catch(err){if(error){error.textContent=authErrorMessage(err,action);error.hidden=false}else notice(authErrorMessage(err,action));console.error('Popcards sign-in:',err)}finally{buttons.forEach(button=>button.disabled=false)}}
function authErrorMessage(error,action){const message=String(error?.message||'').toLowerCase();if(/invalid login credentials|invalid email or password/.test(message))return 'Email or password is incorrect. Check your details and try again.';if(/email not confirmed/.test(message))return 'Please confirm your email using the link we sent before logging in.';if(/user already registered/.test(message))return 'An account with this email already exists. Log in instead.';if(/password should be at least|weak password/.test(message))return 'Choose a stronger password and try again.';if(/email rate limit|rate limit/.test(message))return 'Too many attempts. Wait a little while, then try again.';if(/failed to fetch|networkerror|fetch failed/.test(message))return 'Could not reach the sign-in service. Check your connection and try again.';if(action==='signup'&&/signup is disabled|signups not allowed/.test(message))return 'New account creation is currently disabled. Please contact support.';return error?.message||'Sign-in failed. Please try again.'}
async function oauthLogin(provider){if(!db)return signin();const redirectTo=new URL(window.location.pathname,window.location.origin).toString();const res=await db.auth.signInWithOAuth({provider,options:{redirectTo,skipBrowserRedirect:true}});if(res.error){if(/Unsupported provider/i.test(res.error.message||''))throw new Error(`${provider[0].toUpperCase()+provider.slice(1)} sign-in is not enabled in Supabase yet.`);throw res.error}if(res.data?.url)window.location.assign(res.data.url);}
function usernameDefault(){return ('player_'+me.id.replaceAll('-','').slice(0,9)).slice(0,20)}
async function syncSession(){if(!db)return;const r=await db.auth.getUser();me=r.data.user||null;S.authenticated=!!me;if(!me){clearTimeout(clueResetTimer);scheduleClueReset(localClueState().reset_at);profile=null;people=[];requests=[];challenges=[];window.popcardsVerifiedRankings=[];window.popcardsRankingsLoaded=false;window.popcardsRankingsError=null;window.popcardsScoreSyncError=null;window.popcardsClueBalance=undefined;window.popcardsClueResetAt=null;live?.unsubscribe();live=null;S.scr='profile';render();return}let p=await db.from('profiles').select('*').eq('id',me.id).maybeSingle();if(p.error)throw p.error;if(!p.data){const ins=await db.from('profiles').insert({id:me.id,username:usernameDefault(),display_name:'Player'}).select().single();if(ins.error)throw ins.error;p=ins}profile=p.data;await saveTotalScore();S.profile.name=profile.display_name;S.profile.handle='@'+profile.username;await Promise.all([refresh(),loadOptionalFeature(reloadClues,error=>{window.popcardsClueError=setupMessage(error,'schema.sql');})]);subscribe();render()}
async function saveTotalScore(){
 if(!db||!me)return;
 const {data,error}=await db.rpc('save_total_score',{p_score:Math.max(0,Math.round(S.playerScore||0))});
 if(error){window.popcardsScoreSyncError=setupMessage(error,'rankings.sql');return false;}
 window.popcardsScoreSyncError=null;
 if(Number.isFinite(Number(data)))S.playerScore=Math.max(S.playerScore||0,Number(data));
}
async function reloadRankings(){
 if(!db||!me){window.popcardsVerifiedRankings=[];window.popcardsRankingsLoaded=false;return;}
 const rankings=await loadOptionalFeature(()=>fetchVerifiedRankings(db,me.id),error=>{window.popcardsRankingsError=setupMessage(error,'rankings.sql');window.popcardsRankingsLoaded=false;window.popcardsVerifiedRankings=[];});
 if(!rankings)return;
 window.popcardsRankingsError=null;
 window.popcardsVerifiedRankings=rankings;
 window.popcardsVerifiedFriendIds=friendIds();
 window.popcardsRankingsLoaded=true;
}
async function refresh(){if(!me)return;({people,requests,challenges}=await loadSocialData(db));await reloadRankings();decorate()}
function subscribe(){live?.unsubscribe();live=subscribeToSocial(db,me.id,()=>refresh().then(()=>{if(S.scr==='leaderboard')render()}).catch(console.error))}
function person(id){return findPerson(people,id)}
function friendIds(){return acceptedFriendIds(requests,me?.id)}
function friendList(){return friendIds().map(id=>person(id))}
function playerProfile(id){
 if(id===me?.id){$('#online-modal')?.remove();S.scr='profile';S.modal=null;render();return}
 const ranked=(window.popcardsVerifiedRankings||[]).find(p=>p.id===id),known=people.find(p=>p.id===id);
 if(!ranked&&!known)return notice('Player profile unavailable');
 const name=known?.display_name||ranked.n,username=known?.username||ranked?.username;
 const friends=friendIds().includes(id),request=requests.find(r=>(r.sender_id===me?.id&&r.receiver_id===id)||(r.receiver_id===me?.id&&r.sender_id===id));
 const pending=request?.status==='pending',incoming=pending&&request.receiver_id===me?.id;
 overlay(`<section class="player-profile-sheet"><span class="challenge-kicker">PLAYER PROFILE</span><div class="player-profile-avatar">${CH(ranked?.a||1,104)}</div><h2>${safe(name)}</h2>${username?`<p>@${safe(username)}</p>`:''}${ranked?`<div class="challenge-summary"><strong>${Number(ranked.total).toLocaleString()} points</strong><span>Total score</span></div>`:''}${friends?`<div class="player-friend-status">${ICON('check',20)} Friends</div>`:pending?incoming?`<p>Wants to be your friend</p><button class="act" data-online="profile-accept" data-id="${safe(request.id)}" data-player="${safe(id)}">Accept friend request</button>`:'<button class="online-outline" disabled>Friend request sent</button>':`<button class="act" data-online="profile-add" data-id="${safe(id)}">Add friend</button>`}<p class="online-error" id="player-profile-error" role="alert"></p></section>`);
}
async function addProfileFriend(id,button){
 if(!me)return signin();
 if(button.disabled)return;
 button.disabled=true;
 try{
  if(friendIds().includes(id))return playerProfile(id);
  const existing=requests.find(r=>(r.sender_id===me.id&&r.receiver_id===id)||(r.receiver_id===me.id&&r.sender_id===id));
  if(existing?.status==='pending')return playerProfile(id);
  const result=existing?.status==='declined'&&existing.sender_id===me.id
   ?await db.from('friend_requests').update({status:'pending',responded_at:null}).eq('id',existing.id).eq('sender_id',me.id).eq('status','declined')
   :await db.from('friend_requests').insert({sender_id:me.id,receiver_id:id});
  if(result.error)throw result.error;
  await refresh();playerProfile(id);notice('Friend request sent');
 }catch(error){const target=$('#player-profile-error');if(target)target.textContent=errorMessage(error);button.disabled=false}
}
let friendSearchDraft='';
function friendAddCard(){return `<div class="friend-add-form friends-hero-add"><input id="online-find" name="friend_username" type="text" aria-label="Friend username or display name" placeholder="Search by @username or name" maxlength="40" autocomplete="off" autocapitalize="none" inputmode="text" enterkeyhint="send" spellcheck="false"><button type="button" data-online="request">Add friend</button></div>`}
function onlinePanel(){
 const header=`<section class="friends-page online-unified"><div class="friends-topbar"><div><span class="friends-eyebrow">SOCIAL SPACE ✦</span><h2>Your friends</h2><p>Build a learning crew and keep each other moving.</p></div><span class="friends-topbar-mark">✦</span></div><div class="friends-hero friends-hero-redesign"><div class="friends-hero-copy"><span class="friends-hero-kicker">LEARN TOGETHER</span><h3>Every match is better with a friend.</h3><p>Find your people, share the fun and make vocabulary stick.</p></div><div class="friends-hero-mascot">${CH(18,118)}</div><span class="friends-hero-star">✦</span>${me?friendAddCard():''}</div>`;
 if(!me)return header+`<div class="online-panel"><h3>Connect with friends</h3><p>Sign in to see your friends, invitations, and verified challenges. No example players are shown.</p><button class="act" data-online="login">Log in / Create account</button></div></section>`;
 const incoming=requests.filter(x=>x.receiver_id===me.id&&x.status==='pending');
 const outgoing=requests.filter(x=>x.sender_id===me.id&&x.status==='pending');
 const friends=friendList();
 const friendCard=x=>`<button type="button" class="friend-list-card" data-online="player-profile" data-id="${safe(x.id)}" aria-label="View ${safe(x.display_name)} profile"><span class="friend-list-avatar" aria-hidden="true">${ICON('friends',32)}</span><span class="friend-list-copy"><b>${safe(x.display_name)}</b><small>@${safe(x.username)}</small></span><span class="friend-list-status">${ICON('check',18)}<span>Friends</span></span></button>`;
 const requestCard=x=>{const player=person(x.sender_id);return `<article class="friend-list-card friend-incoming-card"><button type="button" class="friend-request-profile" data-online="player-profile" data-id="${safe(player.id)}"><span class="friend-list-avatar" aria-hidden="true">${ICON('friends',32)}</span><span class="friend-list-copy"><b>${safe(player.display_name)}</b><small>@${safe(player.username)}</small><small>Wants to be your friend</small></span></button><span class="friend-request-actions"><button class="friend-row-action accept" data-online="accept" data-id="${safe(x.id)}">Accept friend</button><button class="friend-row-action decline" data-online="decline" data-id="${safe(x.id)}">Decline</button></span></article>`};
 const sentCard=x=>{const player=person(x.receiver_id);return `<button type="button" class="friend-list-card" data-online="player-profile" data-id="${safe(player.id)}"><span class="friend-list-avatar" aria-hidden="true">${ICON('friends',32)}</span><span class="friend-list-copy"><b>${safe(player.display_name)}</b><small>@${safe(player.username)}</small></span><span class="friend-list-status">Request sent</span></button>`};
 const emptyFriends=`<div class="friends-empty"><span class="friends-empty-icon">${ICON('friends',24)}</span><div><b>Your crew is waiting</b><p>Add someone above to start playing together.</p></div></div>`;
 return header+`<div class="online-panel friends-hub-card"><div class="friends-card-toolbar"><div><h3>Friends <span class="friends-count">${friends.length}</span></h3></div></div><div class="friends-subsection roster-subsection" aria-live="polite">${incoming.map(requestCard).join('')}${outgoing.map(sentCard).join('')}${friends.map(friendCard).join('')}${!friends.length&&!incoming.length&&!outgoing.length?emptyFriends:''}</div></div></section>`;
}
function decorate(){const ct=$('#ph .ct');if(!ct)return;if(S.scr==='profile'){const slot=ct.querySelector('#profile-challenges');if(slot)slot.innerHTML=challengeInbox()}const oldFind=ct.querySelector('#online-find'),oldValue=oldFind?.value||'',draft=friendSearchDraft||oldValue,oldFocused=oldFind===document.activeElement,oldStart=oldFind?.selectionStart??draft.length,oldEnd=oldFind?.selectionEnd??draft.length;ct.querySelectorAll('.online-panel').forEach(n=>n.remove());if(S.scr==='friends'){ct.innerHTML=onlinePanel();ct.querySelector('.online-inline')?.remove();const nextFind=ct.querySelector('#online-find');if(nextFind&&draft){nextFind.value=draft;if(oldFocused){nextFind.focus();try{nextFind.setSelectionRange(oldStart,oldEnd)}catch{}}}}window.popcardsApplyButtons?.()}
let profileAvatarDraft=null;
function profileAvatarPicker(){return `<fieldset class="profile-avatar-field"><legend>Choose your character</legend><div class="profile-avatar-options" role="radiogroup" aria-label="Choose your character">${AVATARS.map(n=>`<button type="button" class="profile-avatar-option" role="radio" aria-checked="${profileAvatarDraft===n}" aria-label="${AVATAR_NAMES[n]||'Character '+n}" title="${AVATAR_NAMES[n]||'Character '+n}" data-online="profile-avatar" data-id="${n}">${CH(n,60)}${AVATAR_NAMES[n]?`<span>${AVATAR_NAMES[n]}</span>`:''}</button>`).join('')}</div></fieldset>`}
function settings(profileOnly=false){profileAvatarDraft=S.profile.avatar;overlay(`<h2>${profileOnly?'Edit profile':'Account settings'}</h2><p>${profileOnly?'Manage your public profile.':'Manage your public profile and sign-in details.'}</p><form id="online-profile" novalidate>${profileAvatarPicker()}<label>Display name<input type="text" name="display_name" required maxlength="40" autocomplete="name" value="${safe(profile.display_name)}"></label><label>Username<input type="text" name="username" required maxlength="21" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="your_username" value="${safe(profile.username)}"><small class="online-small">Use 3–20 letters, numbers, dots or underscores. You can include @.</small></label><button type="submit" class="act">Save profile</button></form>${profileOnly?'':`<div class="account-section"><h3>Sign-in & security</h3><p>Email: <b>${safe(me.email)}</b></p><button class="online-outline" data-online="change-email">Change email</button><button class="online-outline" data-online="change-password">Change password</button></div><div class="account-section"><h3>Account</h3><button class="online-outline" data-online="logout">Log out</button><button class="online-outline online-danger" data-online="delete-account">Delete account</button></div>`}`);const form=$('#online-profile');form?.querySelectorAll('input').forEach(input=>{input.disabled=false;input.readOnly=false;input.tabIndex=0});form?.querySelector('[name="display_name"]')?.focus()}
function recoveryRedirect(){return new URL(window.location.pathname,window.location.origin).toString()}
function forgotPassword(){overlay(`<h2>Reset password</h2><p>Enter your account email. If an account exists, we’ll email recovery instructions.</p><form id="online-forgot"><label>Email<input type="email" name="email" required autocomplete="email"></label><button class="act" ${!configured?'disabled':''}>Send reset link</button></form><button class="online-text-link" data-online="login">Back to sign in</button>`)}
function resetPassword(){overlay(`<h2>Create a new password</h2><p>Choose a new password for your Popcards account.</p><form id="online-reset"><label>New password<input type="password" name="password" required minlength="8" maxlength="128" autocomplete="new-password"></label><label>Confirm password<input type="password" name="confirm" required minlength="8" maxlength="128" autocomplete="new-password"></label><button class="act">Update password</button></form>`)}
function changePassword(){overlay(`<h2>Change password</h2><p>You must verify your current password before updating it.</p><form id="online-password"><label>Current password<input type="password" name="current" required autocomplete="current-password"></label><label>New password<input type="password" name="password" required minlength="8" maxlength="128" autocomplete="new-password"></label><label>Confirm new password<input type="password" name="confirm" required minlength="8" maxlength="128" autocomplete="new-password"></label><button class="act">Save new password</button></form><button class="online-text-link" data-online="account">Back to settings</button>`)}
function changeEmail(){overlay(`<h2>Change email address</h2><p>Supabase may require confirmation at both your old and new email addresses.</p><form id="online-email"><label>New email<input type="email" name="email" required autocomplete="email"></label><button class="act">Send confirmation</button></form><button class="online-text-link" data-online="account">Back to settings</button>`)}
function deleteAccount(){overlay(`<h2>Delete account</h2><p class="online-error">This permanently removes your Popcards account, profile, friendships, challenges, and associated data. This cannot be undone.</p><form id="online-delete"><label>Type DELETE to confirm<input name="confirmation" required autocomplete="off" placeholder="DELETE"></label><button class="act online-destructive">Permanently delete account</button></form><button class="online-outline" data-online="account">Cancel</button>`)}
function samePasswords(data){const pw=String(data.get('password')||'');if(pw.length<8)throw new Error('Use at least 8 characters.');if(pw!==String(data.get('confirm')||''))throw new Error('Passwords do not match.');return pw}
async function submitAccountForm(e){const id=e.target.id;const data=new FormData(e.target);
 if(id==='online-forgot'){const email=String(data.get('email')||'').trim();const r=await db.auth.resetPasswordForEmail(email,{redirectTo:recoveryRedirect()});if(r.error)throw r.error;overlay('<h2>Check your email</h2><p>If this address has an account, you will receive a password reset link.</p><button class="act" data-online="login">Back to login</button>');return}
 if(id==='online-reset'){const r=await db.auth.updateUser({password:samePasswords(data)});if(r.error)throw r.error;history.replaceState(null,'',recoveryRedirect());overlay('<h2>Password updated</h2><p>Your password has been changed successfully.</p><button class="act" data-online="account">Continue</button>');return}
 if(id==='online-password'){const current=String(data.get('current')||'');const newPassword=samePasswords(data);if(current===newPassword)throw new Error('Choose a different password.');const r=await db.auth.signInWithPassword({email:me.email,password:current});if(r.error)throw new Error('Current password is incorrect.');const update=await db.auth.updateUser({password:newPassword});if(update.error)throw update.error;settings();notice('Password updated');return}
 if(id==='online-email'){const email=String(data.get('email')||'').trim();if(email.toLowerCase()===me.email?.toLowerCase())throw new Error('Enter a different email.');const r=await db.auth.updateUser({email,emailRedirectTo:recoveryRedirect()});if(r.error)throw r.error;overlay('<h2>Confirm your email</h2><p>Follow the verification instructions sent by email to complete this change.</p><button class="act" data-online="account">Back to settings</button>');return}
 if(id==='online-delete'){if(String(data.get('confirmation')||'')!=='DELETE')throw new Error('Type DELETE exactly to confirm.');const session=await db.auth.getSession();if(session.error)throw session.error;const jwt=session.data.session?.access_token;if(!jwt)throw new Error('Your session expired. Please sign in again.');const response=await fetch(`${url}/functions/v1/delete-account`,{method:'POST',headers:{Authorization:`Bearer ${jwt}`,apikey:key,'Content-Type':'application/json'},body:JSON.stringify({confirmation:'DELETE'})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||'Unable to delete account. Ensure the delete-account Edge Function is deployed.');await db.auth.signOut();$('#online-modal')?.remove();await syncSession();notice('Account deleted');return}
}

let requestBusy=false;
async function sendRequest(){if(requestBusy)return;const input=$('#online-find'),raw=String(input?.value||friendSearchDraft||'').trim(),query=raw.toLowerCase().replace(/^@/,'');if(!query)return notice('Enter a username');if(query.length<3)return notice('Enter at least 3 characters');requestBusy=true;try{let target=null;const usernameLookup=await db.from('profiles').select('id,username,display_name').eq('username',query).maybeSingle();if(usernameLookup.error)throw usernameLookup.error;target=usernameLookup.data;if(!target){const nameLookup=await db.from('profiles').select('id,username,display_name').ilike('display_name',raw).limit(2);if(nameLookup.error)throw nameLookup.error;if(nameLookup.data?.length>1)return notice('Multiple players have that name — use their @username');target=nameLookup.data?.[0]||null}if(!target)return notice('No player found. Check the @username and try again');if(target.id===me.id)return notice('You cannot add yourself');if(friendIds().includes(target.id))return notice('Already friends');const existing=requests.find(r=>(r.sender_id===me.id&&r.receiver_id===target.id)||(r.sender_id===target.id&&r.receiver_id===me.id));if(existing?.status==='accepted')return notice('Already friends');if(existing?.status==='pending'){return notice(existing.sender_id===me.id?'Request already pending':'This person already sent you a request — check Incoming requests below.')}if(existing?.status==='declined'&&existing.sender_id===me.id){const retry=await db.from('friend_requests').update({status:'pending',responded_at:null}).eq('id',existing.id).eq('sender_id',me.id).eq('status','declined');if(retry.error){if(retry.error.code==='42501'||/policy|permission/i.test(retry.error.message||''))return notice('Supabase blocked resend. Re-run schema.sql to apply friend permissions.');throw retry.error}friendSearchDraft='';if(input)input.value='';notice('Friend request sent');await refresh();return}const out=await db.from('friend_requests').insert({sender_id:me.id,receiver_id:target.id});if(out.error){if(out.error.code==='23505')return notice('A request already exists for this player');if(out.error.code==='42501'||/policy|permission/i.test(out.error.message||''))return notice('Supabase blocked the request. Re-run schema.sql to apply friend permissions.');throw out.error}friendSearchDraft='';if(input)input.value='';notice('Friend request sent');await refresh()}finally{requestBusy=false}}
async function respond(id,decision){const out=await db.from('friend_requests').update({status:decision,responded_at:new Date().toISOString()}).eq('id',id).eq('receiver_id',me.id).eq('status','pending');if(out.error)throw out.error;await refresh()}
async function challenge(id){if(!me||!friendIds().includes(id))throw new Error('Only accepted friends can be challenged');if(alreadyChallenged(id))throw new Error('This match has already been sent to this friend');const words=challengeWords();if(words.length<2)throw new Error('Play a solo match first to choose the challenge words');const target=Math.max(0,Math.round(S.res?.earned||0));const res=await db.from('challenges').insert({sender_id:me.id,receiver_id:id,pairs:words,target_score:target}).select().single();if(res.error)throw res.error;challenges.unshift(res.data);refresh().catch(console.error);return res.data}

let competitiveSession=null, competitiveBusy=false, timer=null;
async function openChallenge(id){
 const c=challenges.find(x=>x.id===id&&x.receiver_id===me.id&&x.status==='pending');
 if(!c||new Date(c.expires_at)<=new Date())throw new Error('This challenge has expired or is already complete.');
 const response=await db.rpc('start_competitive_match',{p_challenge:c.id});if(response.error)throw new Error(setupMessage(response.error,'competitive.sql'));
 const R=createChallengeRound(c,response.data,{level:getLevel(),tier:getTier(),senderName:person(c.sender_id).display_name});
 window.PopcardsRoundController.stop();clearInterval(timer);
 $('#online-modal')?.remove();
 activeOnlineChallenge=c;competitiveSession=response.data;S.activeCh=null;S.modal=null;S.R=R;S.scr='round';
 const deadline=Date.now()+R.t*1000;
 timer=setInterval(()=>{if(S.R!==R){clearInterval(timer);return}R.t=Math.max(0,Math.ceil((deadline-Date.now())/1000));const el=document.getElementById('tm');if(el)el.textContent=fmt(R.t);if(!R.t){clearInterval(timer);finish('timeout')}},250);
 render();
}
async function competitiveFlip(i){
 const R=S.R;if(!activeOnlineChallenge||!competitiveSession||competitiveBusy||R.busy||R.t_[i]?.d||R.pk===i)return;
 competitiveBusy=true;
 try{
  const out=await db.rpc('flip_competitive_card',{p_challenge:activeOnlineChallenge.id,p_index:i});if(out.error)throw out.error;
  const x=out.data;R.t_[i].w=x.word;
  if(x.first){R.pk=i;R.fb='';sfx('flip');render();return}
  R.second=i;R.busy=true;R.mis=x.mistakes;R.combo=x.combo;R.bonusPoints=x.bonus;
  if(x.matched){
   R.fb='Correct! A matching pair';R.t_[x.first_index].d=true;R.t_[i].d=true;R.pairs=x.pairs;
   sfx('correct');
  }else{R.fb='Not a match — try again';sfx('wrong')}
  render();
  await new Promise(resolve=>setTimeout(resolve,x.matched?145:270));
  if(S.R!==R)return;
  R.pk=null;R.second=null;R.busy=false;R.fb='';
  if(x.finished){clearInterval(timer);activeOnlineChallenge=null;competitiveSession=null;finish('complete');
   S.res.earned=x.score;S.res.verified=true;S.res.timeLeft=x.remaining;render();notice('Challenge score: '+x.score+' points');await saveTotalScore();await refresh();
  }else render();
 }catch(e){notice('Server rejected move: '+errorMessage(e));if(/expired|no longer open|Time expired|Already completed/i.test(errorMessage(e))){clearInterval(timer);finish('timeout')}}
 finally{competitiveBusy=false}
}
// Capture card taps before the legacy handler; solo game interactions remain unchanged.
document.addEventListener('click',e=>{const tile=e.target.closest('[data-a="tile"]');if(!tile||!activeOnlineChallenge)return;e.preventDefault();e.stopImmediatePropagation();competitiveFlip(Number(tile.dataset.v))},true);
document.addEventListener('paste',e=>{const input=e.target.closest?.('#online-find');if(!input)return;const text=e.clipboardData?.getData('text/plain');if(!text)return;e.preventDefault();const clean=text.replace(/[\r\n]+/g,'').slice(0,input.maxLength||40);const start=input.selectionStart??input.value.length,end=input.selectionEnd??input.value.length;if(typeof input.setRangeText==='function')input.setRangeText(clean,start,end,'end');else input.value=input.value.slice(0,start)+clean+input.value.slice(end);input.dispatchEvent(new Event('input',{bubbles:true}))},true);
// Never send a browser-calculated score for a competitive match.
window.popcardsOnlineWinHandled=true;
const originalFinish=finish;
finish=function(kind){const before=(window.popcardsVerifiedRankings||[]).findIndex(p=>p.you)+1;if(activeOnlineChallenge){const id=activeOnlineChallenge.id;activeOnlineChallenge=null;competitiveSession=null;db.rpc('end_competitive_match',{p_challenge:id}).then(({error})=>{if(error)notice('Could not finalize match: '+error.message);else refresh().catch(console.error)}).catch(e=>notice(errorMessage(e)));}const result=originalFinish(kind),finishedResult=S.res;if(me)call(async()=>{await saveTotalScore();await reloadRankings();if(S.scr==='leaderboard')render();if(S.res===finishedResult&&kind==='complete'&&window.popcardsRankingsLoaded&&!window.popcardsScoreSyncError){const players=[...window.popcardsVerifiedRankings].sort((a,b)=>b.total-a.total);window.popcardsShowRankUpdate?.(before,players.findIndex(p=>p.you)+1,players)}});else if(kind==='complete')window.popcardsAfterWin?.();return result};
// Re-rendering the legacy prototype destroys DOM. Add live panels back on each render.
let rankingsRefreshing=false;
async function refreshVisibleRankings(){
 if(!me||S.scr!=='leaderboard'||document.hidden||rankingsRefreshing)return;
 rankingsRefreshing=true;
 try{await saveTotalScore();await reloadRankings();if(S.scr==='leaderboard')render()}
 finally{rankingsRefreshing=false}
}
setInterval(()=>{refreshVisibleRankings().catch(console.error);if(S.scr==='profile')decorate();if(me&&S.scr==='friends'&&!document.hidden)refresh().catch(console.error)},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshVisibleRankings().catch(console.error);if(me&&S.scr==='friends')refresh().catch(console.error)}});
let lastOnlineScreen=null;
const originalRender=render;
render=function(){const onlineModal=document.querySelector('#online-modal'),modalHasFocus=!!onlineModal?.contains(document.activeElement);const enteringRankings=S.scr==='leaderboard'&&lastOnlineScreen!=='leaderboard';lastOnlineScreen=S.scr;const r=originalRender();decorate();if(enteringRankings)queueMicrotask(()=>refreshVisibleRankings().catch(console.error));if(modalHasFocus&&onlineModal&&!document.querySelector('#online-modal'))$('#ph')?.append(onlineModal);return r};
// Intercept demo-only account, social and challenge actions; no fake "logged in" messages.
document.addEventListener('click',e=>{const existing=e.target.closest('[data-a]');if(!existing)return;const a=existing.dataset.a;
if(a==='challengepicker'){e.preventDefault();e.stopImmediatePropagation();challengePicker();return}
if(me&&(a==='editprofile'||(a==='modal'&&existing.dataset.v==='settings'))){e.preventDefault();e.stopImmediatePropagation();settings(a==='editprofile');return}
if(['onboardlogin','logout','addfr','addfriend','create','challengefriend','playch'].includes(a)){
 e.preventDefault();e.stopImmediatePropagation();
 if(a==='onboardlogin'){call(()=>oauthLogin(existing.dataset.v==='google'?'google':'facebook'));return}
 if(a==='logout'){if(me)call(async()=>{const r=await db.auth.signOut();if(r.error)throw r.error;await syncSession()});else signin();return}
 if(!me){signin();return}
 if(a==='challengefriend'){challengePicker();return}
 if(a==='addfr'||a==='addfriend'){S.scr='friends';S.modal=null;render();notice('Use Online friends & challenges to connect with real players');return}
 if(a==='create'){S.modal=null;S.scr='friends';render();notice('Select an online friend to send a synchronized challenge');return}
 if(a==='playch'){S.scr='profile';S.modal=null;render();document.getElementById('profile-challenges')?.scrollIntoView({block:'start'});return}
 }
},true);
document.addEventListener('click',e=>{if(e.target.id==='online-modal')e.target.remove()});
document.addEventListener('keydown',e=>{const modal=$('#online-modal');if(!modal)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();modal.remove()}},true);
document.addEventListener('pointerdown',e=>{const input=e.target.closest?.('#online-find');if(input){input.disabled=false;input.readOnly=false;input.focus()}},true);
document.addEventListener('input',e=>{if(e.target.id==='online-find')friendSearchDraft=e.target.value},true);
document.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.target.id!=='online-find')return;e.preventDefault();e.target.closest('.friend-add-form')?.querySelector('[data-online="request"]')?.click()},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-online]');if(!b)return;e.preventDefault();const a=b.dataset.online,id=b.dataset.id;
if(a==='profile-avatar'){const avatar=Number(id);if(AVATARS.includes(avatar)){profileAvatarDraft=avatar;document.querySelectorAll('.profile-avatar-option').forEach(option=>option.setAttribute('aria-checked',String(Number(option.dataset.id)===avatar)))}}else if(a==='player-profile')playerProfile(id);else if(a==='profile-add')addProfileFriend(id,b);else if(a==='profile-accept')call(async()=>{b.disabled=true;try{await respond(id,'accepted');playerProfile(b.dataset.player)}finally{b.disabled=false}});else if(a==='pick-challenge')toggleChallengePlayer(id,b);else if(a==='send-selected-challenges')sendChallenge([...selectedChallengePlayers].join(','),b);else if(a==='challenge')reviewChallenge(id);else if(a==='choose-challenge')challengePicker();else if(a==='send-challenge')sendChallenge(id,b);else if(a==='review-play')reviewIncomingChallenge(id);else if(a==='challenge-result')showChallengeResult(id);else if(a==='challenge-round'){$('#online-modal')?.remove();S.modal=null;startRound('solo');render()}else if(a==='share-invite')call(shareInvite);else if(a==='close')$('#online-modal')?.remove();else if(a==='login')signin();else if(a==='forgot')forgotPassword();else if(a==='change-password')changePassword();else if(a==='change-email')changeEmail();else if(a==='delete-account')deleteAccount();else if(a==='profile-challenges'){$('#online-modal')?.remove();S.scr='profile';S.modal=null;render();document.getElementById('profile-challenges')?.scrollIntoView({block:'start'})}else if(a==='friends'){$('#online-modal')?.remove();S.scr='friends';S.modal=null;render()}else if(a==='leaderboard'){S.scr='leaderboard';S.modal=null;render()}else if(a==='account'){if(me)settings();else signin()}else if(a==='logout')call(async()=>{const r=await db.auth.signOut();if(r.error)throw r.error;$('#online-modal')?.remove();await syncSession()});else if(a==='rankings-refresh')call(async()=>{await reloadRankings();render()});else if(a==='refresh')call(async()=>{await Promise.all([refresh(),reloadClues()]);render()});else if(a==='request')call(sendRequest);else if(a==='accept'||a==='decline')call(async()=>{if(b.disabled)return;b.disabled=true;try{await respond(id,a==='accept'?'accepted':'declined');notice(a==='accept'?'Friend added':'Friend request declined')}finally{b.disabled=false}});else if(a==='challenge')call(()=>challenge(id));else if(a==='play')call(async()=>{
 if(b.disabled)return;
 const message=$('#challenge-start-error');if(message)message.textContent='';
 b.disabled=true;b.textContent='Starting…';
 try{await openChallenge(id)}
 catch(error){if(message&&message.isConnected)message.textContent=errorMessage(error);else notice(errorMessage(error))}
 finally{b.disabled=false;b.textContent='Play challenge'}
});});
document.addEventListener('submit',e=>{if(e.target.id==='online-login'){e.preventDefault();call(()=>submitLogin(e))}if(['online-forgot','online-reset','online-password','online-email','online-delete'].includes(e.target.id)){e.preventDefault();call(()=>submitAccountForm(e))}if(e.target.id==='online-profile'){e.preventDefault();call(async()=>{const form=e.target,d=new FormData(form),display_name=String(d.get('display_name')||'').trim().replace(/\s+/g,' '),username=String(d.get('username')||'').trim().toLowerCase().replace(/^@+/,'');if(!display_name){form.elements.display_name.focus();throw new Error('Enter a display name.')}if(!/^[a-z0-9._]{3,20}$/.test(username)){form.elements.username.focus();throw new Error('Username must be 3–20 letters, numbers, dots or underscores.')}const out=await db.from('profiles').update({display_name,username}).eq('id',me.id).select().single();if(out.error){if(out.error.code==='23505')throw new Error('That username is already taken.');if(out.error.code==='42501'||/row-level security|permission/i.test(out.error.message||''))throw new Error('Supabase blocked this profile update. Re-run schema.sql.');throw out.error}profile=out.data;S.profile.name=display_name;S.profile.handle='@'+username;if(AVATARS.includes(profileAvatarDraft))S.profile.avatar=profileAvatarDraft;$('#online-modal')?.remove();render();notice('Profile saved')})}},true);
if(db){db.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'){queueMicrotask(resetPassword);return}if(!session&&me){me=null;profile=null;S.authenticated=false;window.popcardsVerifiedRankings=[];window.popcardsRankingsLoaded=false;render()}});syncSession().catch(e=>notice('Online setup: '+errorMessage(e)))}else{S.authenticated=false;updateClueState(localClueState());render()}
})();
