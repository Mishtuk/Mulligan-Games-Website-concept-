#!/usr/bin/env bash
# Clean up and upscale one store clip for the front-page video, plus a poster frame.
# Usage: bash tools/enhance-video.sh <input.mp4|.mov> <output-name> [height=1080] [seconds=12]
# Writes media/<name>.mp4 (H.264), media/<name>.webm (VP9) and media/<name>.jpg; no audio (muted loop).
# media/ is gitignored: store videos stay out of the public repo until the owners say yes (OWNER-QUESTIONS Q12).
# The input is untrusted (downloaded): ffmpeg may only read it as an MP4/MOV file from disk, never as a playlist that pulls in other files or URLs.
# ponytail: ffmpeg denoise + lanczos + unsharp only; swap in an AI upscaler (Real-ESRGAN) if low-res clips look soft.
set -euo pipefail
if [ $# -lt 2 ]; then echo "Usage: bash tools/enhance-video.sh <input.mp4|.mov> <output-name> [height=1080] [seconds=12]" >&2; exit 2; fi
in=$1 name=$2 h=${3:-1080} secs=${4:-12}
[[ $name =~ ^[a-z0-9-]+$ ]] || { echo "Output name: lower-case letters, digits and dashes only." >&2; exit 2; }
[[ $h =~ ^[0-9]+$ && $secs =~ ^[0-9]+$ ]] || { echo "Height and seconds must be whole numbers." >&2; exit 2; }
(( h % 2 == 0 && h > 0 && secs > 0 )) || { echo "Height must be even and above 0, seconds above 0." >&2; exit 2; }
[ -f "$in" ] || { echo "Input not found: $in" >&2; exit 2; }
out="$(cd "$(dirname "$0")/.." && pwd)/media"; mkdir -p "$out"
real_in=$(realpath "$in")
for ext in mp4 webm jpg; do
  [ "$real_in" != "$(realpath -m "$out/$name.$ext")" ] || { echo "The output would overwrite the input ($in). Pick another output name." >&2; exit 2; }
done
vf="hqdn3d=1.5:1.5:6:6,scale=-2:${h}:flags=lanczos,unsharp=5:5:0.6:5:5:0,format=yuv420p"
ffmpeg -hide_banner -loglevel error -y -protocol_whitelist file -f mov -i "file:$in" -t "$secs" -an -vf "$vf" \
  -c:v libx264 -preset slow -crf 20 -movflags +faststart "$out/$name.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$out/$name.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 "$out/$name.webm"
ffmpeg -hide_banner -loglevel error -y -i "$out/$name.mp4" -frames:v 1 -q:v 3 "$out/$name.jpg"
ls -l "$out/$name".*
