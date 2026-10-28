# Stock video for the hero montage (D55, #16)

Checked 2026-10-27 (Laptop). Files live in `source/stock/` (git-tracked via a `.gitignore` exception), each trimmed to 8 s
of the 1080p rendition (H.264, crf 19, no audio use) so every file is under 25 MB. The montage script is
`tools/hero-montage-laptop.sh`.

## Top takeaways
- Only Mixkit worked from this machine: its clip pages expose a direct 1080p file URL and its pages state "commercial and
  personal projects without attribution", free and without a watermark. Pexels and Pixabay were not reachable through the
  search tool (no results), and both serve downloads behind scripts or an API key, so none were used. Coverr not tried.
- Mixkit licence: **Mixkit Stock Video Free License** (https://mixkit.co/license/#videoFree). The licence text is shown in a
  modal that could not be read as text here; what was read is Mixkit's own site description ("commercial and personal
  projects without attribution", JSON-LD `license` = the URL above, `isAccessibleForFree` true). Boss: someone with a browser should open
  that modal once and confirm "no attribution, commercial use on a website OK" before launch. Not allowed (general stock
  practice, check): reselling or redistributing the clips as stock. We only ship re-encoded montage frames.
- Author: Mixkit lists no named creator on these pages (publisher Mixkit / Envato). Nothing to credit.
- No clip shows a face or a child: all are hands and tables. No branded card art close-ups (the cards are plain playing cards
  and a generic Catan / Sequence / Monopoly board, which read as "game night", not a publisher's ad; Catan, Monopoly and
  Sequence are visible trademarks of their makers, background use only). The dark-clothing shuffles suit the dark scrim.
- Gap: no free clip of a real card-shop interior or shelves was found; the store's own photos fill that role.

## Clips (all 1920x1080, 24 fps, Mixkit Stock Video Free License)
| File | Mixkit page | Source length | Shows | Shot use (land / port) |
|---|---|---|---|---|
| `mixkit-100372.mp4` | https://mixkit.co/free-stock-video/close-up-of-hands-shuffling-playing-cards-100372/ | 18.1 s | hands in black sleeves shuffling a deck, dark background | opener 3 s / centre crop 2.6 s |
| `mixkit-100384.mp4` | https://mixkit.co/free-stock-video/deck-of-cards-being-shuffled-100384/ | 19.4 s | hands riffle-shuffling a deck | mid 2.8 s / centre crop 2.6 s |
| `mixkit-100398.mp4` | https://mixkit.co/free-stock-video/person-shuffling-playing-cards-over-green-table-100398/ | 10.1 s | hands squaring a deck on a green playmat | late 2.6 s |
| `mixkit-5333.mp4` | https://mixkit.co/free-stock-video/friends-playing-catan-sitting-at-a-table-5333/ | 15.0 s | overhead of a Catan board, hands and cards only, no faces | table shot 2.8 s / centre crop 2.6 s |
| `mixkit-5332.mp4` | https://mixkit.co/free-stock-video/friends-playing-a-game-of-sequence-5332/ | 12.0 s | players' hands holding cards over a board game | 2.6 s |
| `mixkit-5235.mp4` | https://mixkit.co/free-stock-video/friends-playing-monopoly-5235/ | 18.4 s | overhead Monopoly board, hands, dice | spare, not in the cut |
| `mixkit-5334.mp4` | https://mixkit.co/free-stock-video/detailed-shot-of-a-board-in-a-game-of-catan-5334/ | 13.0 s | blurred Catan pieces, shallow focus | spare, not in the cut |

Rejected after a look: casino poker tables (chips, money, dealers: reads as gambling), clips with kids (Lego, chess), the
portrait casino-dice clip 100406, and anything with a visible face.

Direct file pattern (Mixkit): `https://assets.mixkit.co/videos/<id>/<id>-1080.mp4` for the older ids (5xxx) and
`https://assets.mixkit.co/active_storage/video_items/<id>/<stamp>/<id>-video-1080.mp4` for the 100xxx ids (the stamp is on the clip page).

## Superseded (2026-10-27, main session)
The prototype hero now uses the Desktop's store-footage montage (`public/media/video/hero*`, from the store's own
Instagram / TikTok clips, AI-upscaled; copied into `prototype/media/video/`). Side by side, the stock cut (playing-card
shuffles, Catan, Sequence) read as a casino / board-game ad, while the store cut shows the sign, the shop floor, cEDH
playmats, the packed room and the Warhammer table. The Mixkit clips stay in `source/stock/` as spares; the Mixkit licence
text still needs one read in a browser before any of them is used.
