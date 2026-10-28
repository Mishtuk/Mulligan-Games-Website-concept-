#!/usr/bin/env bash
# LAPTOP first-cut hero montage (D55, #16). Same approach as tools/hero-montage.sh (which needs the Desktop's store masters):
# short shots + 0.6 s crossfades, light grade, last frame crossfades into the first, silent, 30 fps. Shots here come from
# free-licensed stock clips (source/stock/, see docs/research/stock-video.md), slow pans across store photos
# (public/img/social/*.webp) and the store's portrait loop. Replaced later by the Desktop's store-footage encode.
# Usage: bash tools/hero-montage-laptop.sh land|port   (masters in media/hero-build/, git-ignored)
#        bash tools/hero-montage-laptop.sh web         (writes prototype/media/video/hero*.mp4 + posters)
set -euo pipefail
mode=${1:-land}
B=media/hero-build; mkdir -p "$B"
if [ "$mode" = web ]; then
  out=prototype/media/video; null=NUL; [ "$(uname -s)" = Linux ] && null=/dev/null
  enc() { local src=$1 sc=$2 br=$3 name=$4 t; t=$(awk "BEGIN{print $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src" | tr -d '\r')-0.1}")
    ffmpeg -v error -y -i "$src" -t "$t" -vf "scale=$sc:flags=lanczos" -c:v libx264 -preset slow -b:v ${br}k -pass 1 -passlogfile "$B/p-$name" -an -f null $null
    ffmpeg -v error -y -i "$src" -t "$t" -vf "scale=$sc:flags=lanczos" -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p \
      -b:v ${br}k -maxrate $((br * 2))k -bufsize $((br * 4))k -pass 2 -passlogfile "$B/p-$name" -movflags +faststart -an "$out/$name"; }
  enc $B/hero-land.mp4 1920:1080 1350 hero.mp4
  enc $B/hero-land.mp4 1280:720 650 hero-720.mp4
  [ -f $B/hero-port.mp4 ] && enc $B/hero-port.mp4 720:1280 800 ${PORT_NAME:-hero-portrait.mp4}
  ffmpeg -v error -y -i "$out/hero.mp4" -frames:v 1 -q:v 4 "$out/hero-poster.jpg"
  rm -f $B/p-*; ls -l "$out"/hero*; exit 0
fi
if [ "$mode" = land ]; then W=1920 H=1080; else W=720 H=1280; fi
o=$B/$mode; mkdir -p "$o"
G="eq=contrast=1.03:saturation=1.05"; base="fps=30,format=yuv420p,setsar=1"
# stock shot: id start dur name [cx]   (portrait takes a centre-ish 9:16 crop of the 16:9 clip; cx = crop centre fraction)
stock() { local id=$1 ss=$2 d=$3 n=$4 cx=${5:-0.5} vf
  if [ "$mode" = land ]; then vf="scale=$W:$H:flags=lanczos"; else vf="crop=ih*9/16:ih:(iw-ih*9/16)*$cx:0,scale=$W:$H:flags=lanczos"; fi
  ffmpeg -hide_banner -loglevel error -y -ss "$ss" -i "source/stock/mixkit-$id.mp4" -t "$d" -an -vf "$vf,$G,$base" -c:v libx264 -preset fast -crf 14 "$o/$n.mp4"; }
# store portrait loop (540x960 AI-upscaled to 720x1280), portrait master only
loop() { ffmpeg -hide_banner -loglevel error -y -ss "$1" -i prototype/media/video/hero-portrait.mp4 -t "$2" -an -vf "scale=$W:$H:flags=lanczos,$G,$base" -c:v libx264 -preset fast -crf 14 "$o/$3.mp4"; }
# store photo with a slow push-in: file dur cx cy name   (cropped to the screen shape first, 4:3 photos are not squashed)
pic() { local f=$1 d=$2 cx=$3 cy=$4 n=$5 fr pcrop; fr=$(awk "BEGIN{print int($d*30)}")
  if [ "$mode" = land ]; then pcrop="crop=iw:iw*9/16:0:(ih-iw*9/16)*$cy"; else pcrop="crop=ih*9/16:ih:(iw-ih*9/16)*$cx:0"; fi
  ffmpeg -hide_banner -loglevel error -y -loop 1 -i "public/img/social/$f.webp" -t "$d" -an \
    -vf "$pcrop,scale=-2:3*$H:flags=lanczos,zoompan=z='1+0.07*on/$fr':x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.5':d=1:s=${W}x${H}:fps=30,$G,$base" \
    -c:v libx264 -preset fast -crf 14 "$o/$n.mp4"; }
if [ "$mode" = land ]; then
  stock 100372 3 3.0 s1 ; pic shop-floor-cases 3.4 0.5 0.5 s2; stock 5333 2 2.8 s3
  pic event-full-room 3.4 0.5 0.45 s4; stock 100384 3 2.8 s5; pic event-cedh-tables 3.4 0.5 0.5 s6
  stock 5332 2 2.6 s7; stock 100398 2 2.6 s8
else
  loop 0 3.2 s1; pic shop-floor-cases 3.2 0.4 0.5 s2; stock 100372 3 2.6 s3 0.5
  pic event-full-room 3.2 0.55 0.5 s4; stock 5333 2 2.6 s5 0.5; pic event-cedh-tables 3.2 0.5 0.5 s6; stock 100384 3 2.6 s7 0.5
  loop 4 2.6 s8
fi
# closing still = first frame, so the last crossfade lands where the loop starts
ffmpeg -hide_banner -loglevel error -y -i "$o/s1.mp4" -frames:v 1 "$o/first.png"
ffmpeg -hide_banner -loglevel error -y -loop 1 -i "$o/first.png" -t 1.0 -vf "$base" -c:v libx264 -preset fast -crf 14 "$o/s9.mp4"
X=0.6; inputs=(); f=""; prev="0:v"; durs=()
for i in 1 2 3 4 5 6 7 8 9; do inputs+=(-i "$o/s$i.mp4"); durs+=($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$o/s$i.mp4" | tr -d '\r')); done
acc=${durs[0]}
for i in 1 2 3 4 5 6 7 8; do
  off=$(awk "BEGIN{print $acc-$X}"); f+="[$prev][$i:v]xfade=transition=fade:duration=$X:offset=$off[v$i];"; prev="v$i"
  acc=$(awk "BEGIN{print $acc+${durs[$i]}-$X}")
done
ffmpeg -hide_banner -loglevel error -y "${inputs[@]}" -filter_complex "${f%;}" -map "[$prev]" -an -c:v libx264 -preset slow -crf 16 -movflags +faststart "$B/hero-$mode.mp4"
ls -l "$B/hero-$mode.mp4"
