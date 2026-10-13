import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const [,, html, out, stills] = process.argv;
const FPS = 30, DUR = 15;
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://' + html); await p.evaluate(()=>document.fonts.ready);
if (stills) {
  for (const t of stills.split(',')) { await p.evaluate(ms=>seek(ms), +t*1000); await p.screenshot({path:`still-${t}.png`}); }
} else {
  const ff = spawn('ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-i','-',
    '-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','slow','-movflags','+faststart', out], {stdio:['pipe','inherit','inherit']});
  for (let f = 0; f < FPS*DUR; f++) {
    await p.evaluate(ms=>seek(ms), f*1000/FPS);
    const buf = await p.screenshot({type:'png'});
    if (!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r=>ff.on('close', r));
}
await b.close();
