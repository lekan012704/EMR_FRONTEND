const fs = require('fs');
let content = fs.readFileSync('src/auth/PatientRegisterPage.tsx', 'utf8');

let lines = content.split('\n');
// Fix line 289 - typo
lines[288] = lines[288].replace('ws-3.5', 'w-3.5').replace('ws-3.5', 'w-3.5');
// Fix line 290 - broken JSX
lines[289] = '     <span>{isBlurred ? "View Original Photo" : "Blur Background"</span>';
// Remove leftover code at the end
let idx = lines.findIndex(l => l.trim() === '= useEmr();');
if (idx >= 0) { lines.splice(idx); }

fs.writeFileSync('src/auth/PatientRegisterPage.tsx', lines.join('\n'));
console.log('Done');