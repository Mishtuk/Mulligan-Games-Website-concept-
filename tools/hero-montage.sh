#!/usr/bin/env bash
# Front-page hero montage, the way the VFW and Riverside heroes are made: short shots (AI-upscaled store clips from
# tools/upscale-video.sh, and slow pans across the store's own photos) joined with crossfades into a silent loop whose
# last frame crossfades back into the first. Writes media/hero-build/seg-*.mp4 and media/hero-{land,port}.mp4 masters.
# Usage: bash tools/hero-montage.sh land|port   (masters), then: bash tools/hero-montage.sh web   (public/media/video/hero*)
set -euo pipefail
mode=${1:-land}
if [ "$mode" = web ]; then # final web files like the VFW encode.sh: 2-pass to size targets, posters = first frame
  out=public/media/video; null=NUL; [ "$(uname -s)" = Linux ] && null=/dev/null
  enc() { local src=$1 sc=$2 br=$3 name=$4 t; t=$(awk "BEGIN{print $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src" | tr -d '\r')-0.1}")
    ffmpeg -v error -y -i "$src" -t "$t" -vf "scale=$sc:flags=lanczos" -c:v libx264 -preset slow -b:v ${br}k -pass 1 -passlogfile "media/hero-build/p-$name" -an -f null $null
    ffmpeg -v error -y -i "$src" -t "$t" -vf "scale=$sc:flags=lanczos" -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p \
      -b:v ${br}k -maxrate $((br * 2))k -bufsize $((br * 4))k -pass 2 -passlogfile "media/hero-build/p-$name" -movflags +faststart -an "$out/$name"; }
  enc media/hero-land.mp4 1920:1080 1350 hero.mp4
  enc media/hero-land.mp4 1280:720 650 hero-720.mp4
  enc media/hero-port.mp4 720:1280 800 hero-portrait.mp4
  ffmpeg -v error -y -i "$out/hero.mp4" -frames:v 1 -q:v 4 "$out/hero-poster.jpg"
  ffmpeg -v error -y -i "$out/hero-portrait.mp4" -frames:v 1 -q:v 4 "$out/hero-poster-portrait.jpg"
  rm -f media/hero-build/p-*; ls -l "$out"/hero*; exit 0
fi
if [ "$mode" = land ]; then W=1920 H=1080; else W=1080 H=1920; fi
out=media/hero-build/$mode; mkdir -p "$out"
G="eq=contrast=1.03:saturation=1.05"                 # light grade, same idea as VFW
base="fps=30,format=yuv420p,setsar=1"
# video shot: file start dur crop-centre-y (fraction of height, land only)
vid() { local f=$1 ss=$2 d=$3 cy=${4:-0.5} n=$5
  if [ "$mode" = land ]; then vf="crop=iw:iw*9/16:0:(ih-iw*9/16)*$cy,scale=$W:$H:flags=lanczos"; else vf="scale=$W:$H:flags=lanczos"; fi
  ffmpeg -hide_banner -loglevel error -y -ss "$ss" -i "media/$f-hq.mp4" -t "$d" -an -vf "$vf,$G,$base" -c:v libx264 -preset fast -crf 14 "$out/$n.mp4"; }
# photo shot with a slow push-in: file dur centre-x centre-y (fractions)
pic() { local f=$1 d=$2 cx=${3:-0.5} cy=${4:-0.5} n=$5 fr pcrop; fr=$(awk "BEGIN{print int($d*30)}")
  # crop the photo to the screen shape first (4:3 photos would otherwise be squashed)
  if [ "$mode" = land ]; then pcrop="crop=iw:iw*9/16:0:(ih-iw*9/16)*$cy"; else pcrop="crop=ih*9/16:ih:(iw-ih*9/16)*$cx:0"; fi
  ffmpeg -hide_banner -loglevel error -y -loop 1 -i "source/social/desktop/ig/$f" -t "$d" -an \
    -vf "$pcrop,scale=-2:4*$H:flags=lanczos,zoompan=z='1+0.07*on/$fr':x='(iw-iw/zoom)*$cx':y='(ih-ih/zoom)*$cy':d=1:s=${W}x${H}:fps=30,$G,$base" \
    -c:v libx264 -preset fast -crf 14 "$out/$n.mp4"; }
vid storefront-exterior 0 1.6 0.0 s1
pic C_o8xFxxezu-3.jpg 3.6 0.5 0.45 s2
vid cedh-players-tables 4.5 1.8 0.25 s3
pic DBmvRtXtXUv-2.jpg 3.6 0.5 0.5 s4
vid slabs-case 6.2 2.8 0.45 s5
pic DCFb9novIHP-1.jpg 3.4 0.5 0.55 s6
vid cedh-monthly-event 4.2 3.0 0.5 s7
pic DV40v1LGuCY-4.jpg 3.6 0.5 0.5 s8
# the first frame as a still, so the loop's last crossfade lands exactly where it starts
ffmpeg -hide_banner -loglevel error -y -i "$out/s1.mp4" -frames:v 1 "$out/first.png"
ffmpeg -hide_banner -loglevel error -y -loop 1 -i "$out/first.png" -t 1.0 -vf "$base" -c:v libx264 -preset fast -crf 14 "$out/s9.mp4"
X=0.6; inputs=(); f=""; off=0; prev="0:v"
for i in 1 2 3 4 5 6 7 8 9; do inputs+=(-i "$out/s$i.mp4"); done
durs=(); for i in 1 2 3 4 5 6 7 8 9; do durs+=($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/s$i.mp4" | tr -d '\r')); done
acc=${durs[0]}
for i in 1 2 3 4 5 6 7 8; do
  off=$(awk "BEGIN{print $acc-$X}"); f+="[$prev][$i:v]xfade=transition=fade:duration=$X:offset=$off[v$i];"; prev="v$i"
  acc=$(awk "BEGIN{print $acc+${durs[$i]}-$X}")
done
ffmpeg -hide_banner -loglevel error -y "${inputs[@]}" -filter_complex "${f%;}" -map "[$prev]" -an -c:v libx264 -preset slow -crf 16 -movflags +faststart "media/hero-$mode.mp4"
ls -l "media/hero-$mode.mp4"
