// Popcards legacy shared-scope script. Loaded in manifest order.
const POP_SFX_KEY='popcards-sound-on';
let popSoundOn=true;
try{popSoundOn=localStorage.getItem(POP_SFX_KEY)!=='off'}catch(e){}
let popAudio=null, popLastTick=-1;
function soundCtx(){if(!popSoundOn)return null;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!popAudio)popAudio=new C();if(popAudio.state==='suspended')popAudio.resume().catch(()=>{});return popAudio}catch(e){return null}}
function tone(hz=500,at=0,dur=.10,type='sine',vol=.075,endHz){
 const ac=soundCtx();if(!ac)return;const t=ac.currentTime+at,osc=ac.createOscillator(),gain=ac.createGain();
 osc.type=type;osc.frequency.setValueAtTime(hz,t);if(endHz)osc.frequency.exponentialRampToValueAtTime(Math.max(40,endHz),t+dur);
 gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
 osc.connect(gain);gain.connect(ac.destination);osc.start(t);osc.stop(t+dur+.02);
}
function sfx(name){if(!popSoundOn)return;
 switch(name){
 case 'tap':tone(460,0,.065,'sine',.028,560);break;
 case 'flip':tone(330,0,.07,'triangle',.042,510);break;
 case 'correct':tone(540,0,.11,'sine',.065,670);tone(800,.09,.14,'sine',.07,970);break;
 case 'wrong':tone(330,0,.12,'triangle',.050,260);tone(240,.10,.11,'sine',.035,190);break;
 case 'combo':tone(670,0,.09,'sine',.06,820);tone(850,.08,.11,'sine',.07,1040);tone(1140,.17,.15,'sine',.06,1300);break;
 case 'win':[523,659,784,1046].forEach((n,i)=>tone(n,i*.11,.23,'sine',.085,n*1.02));break;
 case 'timeout':tone(550,0,.18,'triangle',.07,350);tone(400,.19,.23,'triangle',.065,220);break;
 case 'warning':tone(780,0,.095,'sine',.055,690);break;
 case 'reward':tone(650,0,.10,'sine',.045,810);tone(920,.09,.13,'sine',.055,1050);break;
 }
}
function setSound(on){popSoundOn=!!on;try{localStorage.setItem(POP_SFX_KEY,on?'on':'off')}catch(e){};if(on)sfx('correct');render()}
