#!/usr/bin/env bash
# AI-upscale one store clip with Real-ESRGAN (x4plus, photo model), then size it for the web.
# Usage: bash tools/upscale-video.sh <input video> <output-name> [height=1920] [seconds=12]
# Needs: ffmpeg, and realesrgan-ncnn-vulkan.exe (official xinntao/Real-ESRGAN release) at $REALESRGAN
#        (default ~/tools/realesrgan). Writes media/<name>-hq.mp4 (master, CRF 18) into the git-ignored media/;
#        make the web copy from it with tools/enhance-video.sh or by hand.
# ponytail: frame-by-frame PNGs on disk (a few GB for 12 s); fine for short loops, stream it if clips get long.
set -euo pipefail
if [ $# -lt 2 ]; then echo "Usage: bash tools/upscale-video.sh <input> <output-name> [height=1920] [seconds=12]" >&2; exit 2; fi
in=$1 name=$2 h=${3:-1920} secs=${4:-12}
[[ $name =~ ^[a-z0-9-]+$ ]] || { echo "Output name: lower-case letters, digits and dashes only." >&2; exit 2; }
[[ $h =~ ^[0-9]+$ && $secs =~ ^[0-9]+$ ]] && (( h % 2 == 0 && h > 0 && secs > 0 )) || { echo "Height (even) and seconds must be whole numbers above 0." >&2; exit 2; }
[ -f "$in" ] || { echo "Input not found: $in" >&2; exit 2; }
tool=${REALESRGAN:-$HOME/tools/realesrgan}/realesrgan-ncnn-vulkan.exe
[ -x "$tool" ] || { echo "Real-ESRGAN not found at $tool (set REALESRGAN)." >&2; exit 2; }
root="$(cd "$(dirname "$0")/.." && pwd)"; out="$root/media"; mkdir -p "$out"
win() { if command -v cygpath >/dev/null; then cygpath -w "$1"; else echo "$1"; fi; }
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
mkdir "$work/in" "$work/up"
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "file:$(win "$in")")
ffmpeg -hide_banner -loglevel error -y -protocol_whitelist file -i "file:$(win "$in")" -t "$secs" -an "$work/in/%05d.png"
"$tool" -i "$(win "$work/in")" -o "$(win "$work/up")" -n realesrgan-x4plus -f png >/dev/null
ffmpeg -hide_banner -loglevel error -y -framerate "$fps" -i "$work/up/%05d.png" \
  -vf "scale=-2:${h}:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 18 -movflags +faststart "$out/$name-hq.mp4"
ls -l "$out/$name-hq.mp4"
