/** Pure, deterministic match rules. No DOM, storage, network, or timers. */
export const ROUND_SECONDS = 30;
export function createRound({ pairs, mode='solo', tier=0, level=1, rareKeys=[], difficultKeys=[], clue=0, order } = {}) {
  if (!Array.isArray(pairs) || !pairs.length || pairs.some(p => !Array.isArray(p) || p.length !== 2)) throw new TypeError('At least one valid word pair is required');
  const cards = pairs.flatMap(([word, meaning],k)=>[{w:word,k,d:false},{w:meaning,k,d:false}]);
  const indices = order || cards.map((_,i)=>i);
  if(indices.length !== cards.length || new Set(indices).size !== cards.length || indices.some(i=>!Number.isInteger(i)||i<0||i>=cards.length)) throw new TypeError('Invalid card order');
  return {tier,level,rareKeys:[...rareKeys],difficultKeys:[...difficultKeys],bonusPoints:0,lastGain:0,mode,total:pairs.length,t:ROUND_SECONDS,mis:0,pairs:0,missedKeys:[],clue:mode==='challenge'?0:clue,pk:null,second:null,busy:false,fb:'',fx:0,h:null,earnedPairs:0,clueFx:false,combo:0,t_:indices.map(i=>({...cards[i]})),status:'playing'};
}
export function pickCard(r,index) {
  const t=r?.t_[index];
  if(!r || r.status!=='playing' || r.busy || !t || t.d || r.pk===index)return {accepted:false};
  r.h=null;r.clueFx=false;
  if(r.pk===null){r.pk=index;r.fb='';r.fx=0;return {accepted:true,type:'first'};}
  const first=r.t_[r.pk];r.second=index;r.busy=true;
  if(first.k===t.k){
    r.fb='Correct! A matching pair';r.fx=(r.fx||0)+1;r.combo=(r.combo||0)+1;
    const rare=r.rareKeys.includes(t.k),streakBonus=r.combo>=2?Math.min(r.combo-1,4)*5:0,rareBonus=rare?25:0,difficult=!rare&&r.difficultKeys.includes(t.k),difficultBonus=difficult?15:0;
    const gain=10+streakBonus+rareBonus+difficultBonus;r.lastGain=gain;r.lastRare=rare;r.lastDifficult=difficult;r.lastComboBonus=streakBonus;r.bonusPoints+=streakBonus+rareBonus+difficultBonus;
    return {accepted:true,type:'match',gain,rare,difficult,delay:145};
  }
  r.mis++;for(const k of [first.k,t.k])if(!r.missedKeys.includes(k))r.missedKeys.push(k);
  r.combo=0;r.lastRare=false;r.lastDifficult=false;r.lastComboBonus=0;r.fb='Not a match — try again';
  return {accepted:true,type:'miss',delay:270};
}
export function resolvePick(r){
  if(!r?.busy||r.pk===null||r.second===null||r.status!=='playing')return {resolved:false};
  const matched=r.t_[r.pk].k===r.t_[r.second].k;
  if(matched){r.t_[r.pk].d=true;r.t_[r.second].d=true;r.pairs++;
    if(r.mode!=='review'&&r.mode!=='words-match')r.earnedPairs+=r.lastGain;
  }
  r.pk=null;r.second=null;r.busy=false;if(!matched)r.fb='';
  return {resolved:true,matched,completed:r.pairs===r.total,gain:matched?r.lastGain:0};
}
export function tickRound(r,seconds=1){
  if(!r||r.status!=='playing'||r.mode==='review')return {expired:false};
  r.t=Math.max(0,r.t-Math.max(0,seconds));
  if(r.t===0){r.status='timeout';return {expired:true};}
  return {expired:false};
}
export function showClue(r){
  if(!r||r.status!=='playing'||r.mode==='challenge'||r.busy)return false;
  const i=r.t_.findIndex(x=>!x.d);if(i<0)return false;
  const j=r.t_.findIndex((x,k)=>k!==i&&!x.d&&x.k===r.t_[i].k);
  if(j<0)return false;
  r.h=[i,j];r.pk=null;r.fb='Clue shown';r.clueFx=true;return true;
}
export function finishRound(r,kind){
  if(!r)return null;
  r.status=kind;
  const result={level:r.level,bonusPoints:r.bonusPoints||0,kind,pairs:r.pairs,mis:r.mis,el:ROUND_SECONDS-r.t,mode:r.mode,total:r.total};
  if(kind==='complete' && r.mode!=='review' && r.mode!=='words-match'){
    const base=r.pairs*10,timeB=r.t*2,perfect=r.mis===0,pen=r.mis*5;
    result.earned=Math.max(base,base+50+timeB-pen)+(perfect?30:0)+(r.bonusPoints||0);
    Object.assign(result,{base,timeB,pen,perfect});
  }
  return result;
}
