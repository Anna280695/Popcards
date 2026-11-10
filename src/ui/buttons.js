// Shared action hierarchy. Navigation, selection cards and game tiles keep their own styles.
const primary='.act,.friend-add-form>button,.round-menu-v3-resume,.fp-next';
const yellow='.chx-play,.recap-link[data-v="profile"],.recap-friend-button,.round-action.primary,.fp-known,.fp-match,.friend-row-action.accept,.invite-v3-copy';
const white='.online-outline,.pop-playsecondary,.recap-link,.onboard-social button,.settings-account-action,.my-edit,.friend-row-action.decline,.fp-again,.fp-prev,.fp-audio,.fv8-audio,.round-menu-v3-exit,.invite-v3-facebook,.sent-secondary,.friend-profile-secondary,.fb-new-secondary,.fb-new-primary';

export function applyButtonHierarchy(root=document) {
 const scopeSelector='.ct,.sh,.online-sheet,.round-dock';
 for(const scope of root.querySelectorAll(scopeSelector)) {
  const owns=button=>button.closest(scopeSelector)===scope;
  for(const button of scope.querySelectorAll(`button:is(${white})`))if(owns(button))button.dataset.buttonVariant='white';
  for(const button of scope.querySelectorAll(`button:is(${yellow})`))if(owns(button))button.dataset.buttonVariant='yellow';
  const candidates=[...scope.querySelectorAll(`button:is(${primary})`)].filter(owns);
  // Keep a single main action; additional actions use the yellow outline treatment.
  candidates.forEach((button,index)=>button.dataset.buttonVariant=index===0?'primary':'yellow');
 }
}
