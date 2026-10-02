import { initTheme } from './theme.js';
import { initLang } from './lang.js';
import { initReveal } from './reveal.js';
import { initDuration } from './duration.js';
import { initTerminal } from './terminal.js';
import { CONSOLE_HINT } from './ctf-console.js';

initTheme();
initLang();
initReveal();
initDuration();
initTerminal();

console.log('%cHey, curious developer', 'font-weight:bold;font-size:14px');
console.log(`Psst: ${CONSOLE_HINT} is Base64. Decode it, then submit what you get at /lab/ctf/`);
