#!/usr/bin/env bash
# Front-page hero montage, the way the VFW and Riverside heroes are made: short shots (AI-upscaled store clips from
# tools/upscale-video.sh, and slow pans across the store's own photos) joined with crossfades into a silent loop whose
# last frame crossfades back into the first. Writes media/hero-build/seg-*.mp4 and media/hero-{land,port}.mp4 masters.
# Usage: bash tools/hero-montage.sh land|port   (run from the repo root; inputs in media/ and source/social/desktop/ig/)
set -euo pipefail
mode=${1:-land}
if [ "$mode" = land ]; then W=1920 H=1080; else W=1080 H=1920; fi
out=media/hero-build/$mode; mkdir -p "$out"
G="eq=contrast=1.03:saturation=1.05"                 # light grade, same idea as VFW
base="fps=30,format=yuv420p,setsar=1"
# video shot: file start dur crop-centre-y (fraction of height, land only)
vid() { local f=$1 ss=$2 d=$3 cy=${4:-0.5} n=$5
  if [ "$mode" = land ]; then vf="crop=iw:iw*9/16:0:(ih-iw*9/16)*$cy,scale=$W:$H:flags=lanczos"; else vf="scale=$W:$H:flags=lanczos"; fi
  ffmpeg -hide_banner -loglevel error -y -ss "$ss" -i "media/$f-hq.mp4" -t "$d" -an -vf "$vf,$G,$base" -c:v libx264 -preset fast -crf 14 "$out/$n.mp4"; }
# photo shot with a slow push-in: file dur centre-x centre-y (fractions)
pic() { local f=$1 d=$2 cx=${3:-0.5} cy=${4:-0.5} n=$5 fr; fr=$(awk "BEGIN{print int($d*30)}")
  ffmpeg -hide_banner -loglevel error -y -loop 1 -i "source/social/desktop/ig/$f" -t "$d" -an \
    -vf "scale=-2:4*$H:flags=lanczos,zoompan=z='1+0.07*on/$fr':x='(iw-iw/zoom)*$cx':y='(ih-ih/zoom)*$cy':d=1:s=${W}x${H}:fps=30,$G,$base" \
    -c:v libx264 -preset fast -crf 14 "$out/$n.mp4"; }
vid storefront-exterior 0 2.4 0.0 s1
pic C_o8xFxxezu-3.jpg 3.6 0.5 0.45 s2
vid cedh-players-tables 3.4 2.8 0.25 s3
pic DBmvRtXtXUv-2.jpg 3.6 0.5 0.5 s4
vid slabs-case 6.2 2.8 0.45 s5
pic DCFb9novIHP-1.jpg 3.4 0.5 0.55 s6
vid cedh-monthly-event 4.2 3.0 0.5 s7
pic DV40v1LGuCY-4.jpg 3.6 0.5 0.5 s8
# the first frame as a still, so the loop's last crossfade lands exactly where it starts
ffmpeg -hide_banner -loglevel error -y -i "$out/s1.mp4" -frames:v 1 "$out/first.png"
ffmpeg -hide_banner -loglevel error -y -loop 1 -i "$out/first.png" -t 0.7 -vf "$base" -c:v libx264 -preset fast -crf 14 "$out/s9.mp4"
X=0.6; inputs=(); f=""; off=0; prev="0:v"
for i in 1 2 3 4 5 6 7 8 9; do inputs+=(-i "$out/s$i.mp4"); done
durs=(); for i in 1 2 3 4 5 6 7 8 9; do durs+=($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/s$i.mp4" | tr -d '\r')); done
acc=${durs[0]}
for i in 1 2 3 4 5 6 7 8; do
  off=$(awk "BEGIN{print $acc-$X}"); f+="[$prev][$i:v]xfade=transition=fade:duration=$X:offset=$off[v$i];"; prev="v$i"
  acc=$(awk "BEGIN{print $acc+${durs[$i]}-$X}")
done
ffmpeg -hide_banner -loglevel error -y "${inputs[@]}" -filter_complex "${f%;}" -map "[$prev]" -an -c:v libx264 -preset slow -crf 16 -movflags +faststart "media/hero-$mode.mp4"
# drop the held still at the end: the loop restarts on that exact frame
total=$(awk "BEGIN{print $acc-0.7+$X/2}")
ffmpeg -hide_banner -loglevel error -y -i "media/hero-$mode.mp4" -t "$total" -c copy "media/hero-$mode-loop.mp4" 2>/dev/null || cp "media/hero-$mode.mp4" "media/hero-$mode-loop.mp4"
ls -l media/hero-$mode*.mp4
