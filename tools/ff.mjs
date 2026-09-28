// Resolve an ffmpeg binary: $FFMPEG, then PATH, then the imageio-ffmpeg wheel.
import { execFileSync } from 'node:child_process';

export function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg'; } catch {}
  try {
    return execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'])
      .toString().trim();
  } catch {}
  throw new Error('ffmpeg not found. Install it, set $FFMPEG, or `pip install imageio-ffmpeg`.');
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(ffmpegPath());
