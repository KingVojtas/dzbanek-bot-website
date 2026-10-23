// Czech captions: the English cue timings with Czech text, in the site's informal "ty".
import fs from "node:fs";
const CS = {
  "Every Discord server has a kitchen.": "Každý discordový server má svou kuchyni.",
  "The channel where everyone ends up.": "Kanál, kde nakonec skončí všichni.",
  "This is Dzbanek.": "Tohle je Dzbanek.",
  "It keeps the kitchen going.": "Drží kuchyni v chodu.",
  "Type /play, and whatever you're in the mood for.": "Napiš /play a cokoli, na co máš zrovna chuť.",
  "A YouTube link, a Spotify playlist, or just the name of a song.": "Odkaz z YouTube, playlist ze Spotify, nebo jen název písničky.",
  "Rather have the radio on?": "Radši si pustíš rádio?",
  "Kiss, Rock Radio, or Radio Beat.": "Kiss, Rock Radio nebo Radio Beat.",
  "Live, with the song that's playing right now.": "Živě, i s písničkou, která zrovna hraje.",
  "The Kitchen Board is one message that keeps itself up to date.": "Kitchen Board je jedna zpráva, která se sama aktualizuje.",
  "What's playing, who's in voice, and today's best deal.": "Co hraje, kdo je ve voice a nejlepší sleva dne.",
  "Every morning at 3:33, ten Steam deals worth a look.": "Každé ráno ve 3:33 deset slev ze Steamu, které stojí za to.",
  "And Epic's free games, as soon as they drop.": "A hry zdarma z Epicu, jakmile vyjdou.",
  "And when somebody new walks in?": "A když přijde někdo nový?",
  "They get a cookie.": "Dostane sušenku.",
  "Dzbanek.": "Dzbanek.",
  "It's free.": "Je zdarma.",
  "Pull up a chair.": "Přisedni si.",
};
const en = fs.readFileSync("captions-en.vtt", "utf8");
let missing = [];
const cs = en.replace(/^(\d\d:\d\d\.\d{3} --> \d\d:\d\d\.\d{3}\n)(.+)$/gm, (m, time, text) => {
  if (!CS[text]) missing.push(text);
  return time + (CS[text] || text);
});
if (missing.length) throw new Error("no Czech for: " + missing.join(" | "));
fs.writeFileSync("captions-cs.vtt", cs);
console.log(cs.split("\n\n").length - 1, "Czech cues");
