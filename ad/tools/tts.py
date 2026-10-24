# python tools/tts.py lines.json vo <id>   (needs: pip install edge-tts)
# The same voice and settings as tts.mjs, through the Python edge-tts client, for when
# msedge-tts can't reach the service. Writes <id>.mp3 and <id>.json in msedge-tts's
# {"Metadata": [WordBoundary...]} shape, so timeline.mjs reads it the same way.
import asyncio
import json
import sys

import edge_tts

lines_path, out_dir, line_id = sys.argv[1:4]
line = next(l for l in json.load(open(lines_path, encoding="utf-8")) if l["id"] == line_id)


async def main():
    tts = edge_tts.Communicate(
        line["say"],
        line.get("voice", "en-US-AndrewMultilingualNeural"),
        rate=line.get("rate", "-6%"),
        pitch=line.get("pitch", "+0Hz"),
        boundary="WordBoundary",
    )
    meta = []
    with open(f"{out_dir}/{line_id}.mp3", "wb") as audio:
        async for chunk in tts.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                meta.append({
                    "Type": "WordBoundary",
                    "Data": {
                        "Offset": chunk["offset"],
                        "Duration": chunk["duration"],
                        "text": {"Text": chunk["text"], "Length": len(chunk["text"]), "BoundaryType": "WordBoundary"},
                    },
                })
    with open(f"{out_dir}/{line_id}.json", "w", encoding="utf-8") as f:
        json.dump({"Metadata": meta}, f, indent=2, ensure_ascii=False)
    print("ok", line_id, len(meta), "words")


asyncio.run(main())
