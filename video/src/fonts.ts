import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Same faces as the app: Pretendard (variable, covers Hangul) and JetBrains Mono.
loadFont({ family: 'Pretendard', url: staticFile('fonts/PretendardVariable.woff2'), weight: '45 920', format: 'woff2' });
for (const w of [400, 500, 600]) {
  loadFont({ family: 'JetBrains Mono', url: staticFile(`fonts/JetBrainsMono-${w}.woff2`), weight: String(w), format: 'woff2' });
}
