import {applyButtonHierarchy} from './ui/buttons.js';
import './gameplay/rank-overlay.js';
import '../config.js';
import * as GameEngine from './gameplay/engine.js';
import { createRoundController } from './gameplay/round-controller.js';
window.PopcardsGameEngine = GameEngine;
window.PopcardsRoundController = createRoundController({
  engine: GameEngine,
  onStart: mode => { if (S.scr === 'prematch') { beginRound(mode); render(); } },
  onExpired: () => finish('timeout'),
  onResolved: (round, outcome) => {
    if (S.R !== round || S.scr !== 'round') return;
    if (outcome.matched && round.mode !== 'review' && round.mode !== 'words-match') {
      const previousLevel=getLevel();
      S.playerScore += outcome.gain;
      if(getLevel()>previousLevel){round.levelFx={level:getLevel(),until:Date.now()+2200};}
    }
    if (outcome.completed) celebrateWin(); else render();
  },
  onChange: (round, action) => {
    if (S.R !== round || S.scr !== 'round' || action) return;
    const mt = document.getElementById('menu-time');
    if (mt) {
      mt.textContent = Math.max(0, round.t);
      document.getElementById('menu-ring')?.setAttribute('stroke-dashoffset', (213.63 * (1 - Math.max(0,round.t)/30)).toFixed(2));
      mt.closest('[role="timer"]')?.setAttribute('aria-label', `${Math.max(0,round.t)} seconds left`);
      mt.closest('.round-menu-v3-time')?.classList.toggle('low',round.t<=10);
    }
    const label = document.getElementById('tm');
    if (label) label.textContent = fmt(round.t);
    if (round.t===10) sfx('warning');
  }
});
import { createClient } from '@supabase/supabase-js';
import './styles/base.css';
import './styles/refinements.css';
import '../app.css';
import './styles/buttons.css';
window.popcardsApplyButtons=applyButtonHierarchy;
applyButtonHierarchy();

// Compatibility bridge: classic prototype scripts are loaded in index.html before
// this module executes. Online features are now split into imported ES modules.
window.supabase = { createClient };
window.POPCARDS_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || window.POPCARDS_SUPABASE_URL || '';
window.POPCARDS_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || window.POPCARDS_SUPABASE_ANON_KEY || '';
const onlineModule = new URLSearchParams(location.search).has('preview')
  ? import('./preview/index.js')
  : import('./online/index.js');
onlineModule.catch(error => {
  console.error('Popcards online initialization failed:', error);
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(console.warn));
}
