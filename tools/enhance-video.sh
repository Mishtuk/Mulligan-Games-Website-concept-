#!/usr/bin/env bash
# Clean up and upscale one store clip for the front-page video, plus a poster frame.
# Usage: bash tools/enhance-video.sh <input> <output-name> [height=1080] [seconds=12]
# Writes media/<name>.mp4 (H.264), media/<name>.webm (VP9) and media/<name>.jpg; no audio (muted loop).
# media/ is gitignored: store videos stay out of the public repo until the owners say yes (OWNER-QUESTIONS Q12).
# ponytail: ffmpeg denoise + lanczos + unsharp only; swap in an AI upscaler (Real-ESRGAN) if low-res clips look soft.
set -euo pipefail
in=$1 name=$2 h=${3:-1080} secs=${4:-12}
out="$(dirname "$0")/../media"; mkdir -p "$out"
vf="hqdn3d=1.5:1.5:6:6,scale=-2:${h}:flags=lanczos,unsharp=5:5:0.6:5:5:0,format=yuv420p"
ffmpeg -hide_banner -loglevel error -y -i "$in" -t "$secs" -an -vf "$vf" \
  -c:v libx264 -preset slow -crf 20 -movflags +faststart "$out/$name.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$out/$name.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 "$out/$name.webm"
ffmpeg -hide_banner -loglevel error -y -i "$out/$name.mp4" -frames:v 1 -q:v 3 "$out/$name.jpg"
ls -l "$out/$name".*
