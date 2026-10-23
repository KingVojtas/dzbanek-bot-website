# The Dzbanek ad

Source for the 54-second ad in the home hero (`assets/ad/`). It isn't part of the site build; `scripts/build.mjs` only publishes `assets/` and `src/`.

The picture is one HTML page, `ad.html`, where `render(t)` puts everything where it belongs at `t` seconds: the kitchen photo, a Discord window, the camera, the pointer and the typing. Chrome renders it frame by frame. All the timing comes from the voice-over, so the picture follows the words.

## Rebuilding

You need Node, Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` (change it in `tools/render.mjs`), and ffmpeg on the path.

```bash
cd ad/tools && npm install && cd ..
node tools/tts.mjs vo lines.json      # voice: vo/<scene>.mp3 + word timings (Microsoft Edge TTS, en-US-AndrewMultilingualNeural)
node tools/timeline.mjs .             # timeline.json + captions-en.vtt from the word timings
node cs-captions.mjs                  # captions-cs.vtt, same cues in Czech
node tools/render.mjs . cues          # cues.json: sound cues and chapter starts
node tools/synth.mjs .                # bed.wav (lo-fi electric piano, bass, brushes) and sfx.wav (keys, clicks, pops)
node tools/audio.mjs .                # vo.wav, then mix.wav: the bed ducks under the voice, -16 LUFS
node tools/render.mjs . video video-120.mp4 120   # about 6 minutes
node tools/encode.mjs .               # 30 fps with motion blur and grain -> dzbanek-ad-1080.mp4, dzbanek-ad-720.mp4
```

Then copy the two MP4s and both `.vtt` files into `assets/ad/`, and put the chapter starts from `cues.json` and the length into `src/js/film.js`.

`vo/` is committed, because the TTS service can change its voices; rerun `tts.mjs` only when the script in `lines.json` changes. `node tools/render.mjs . stills 0,12.5,30` writes single frames to `stills/` for checking a moment without a full render.

## Rules the ad keeps

- Frame 0 is exactly `assets/kitchen-hero.jpg` and the last frame goes back to it, so the hero photo seems to start moving and the ad hands back to the site without a jump.
- Everything said or shown is something the bot does (see the site copy): six commands, ten Steam deals at 03:33, Epic at 12:00 and 17:00, the Kitchen Board fields, the welcome message text.
- The songs, games and people in the Discord window are made up.
