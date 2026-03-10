#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# paletta — generate color palettes from the terminal
#
# Usage:
#   ./paletta.sh <color>                          Show all harmonies
#   ./paletta.sh <color> --json                   Output as JSON
#   ./paletta.sh <color> --harmony triadic         One harmony only
#   ./paletta.sh <color> -s 60 -l 50              Custom saturation/lightness
#   ./paletta.sh --list                            List named colors
#   ./paletta.sh --help                            Show help
#
# Color input:
#   Hex:   "#3b82f6" or "3b82f6"
#   Named: blue, teal, rose, indigo, etc.
# ─────────────────────────────────────────────

VERSION="1.0.0"

# ── Named colors (Tailwind-inspired) ──

declare -A NAMED_COLORS=(
  [red]="ef4444"    [orange]="f97316"  [amber]="f59e0b"   [yellow]="eab308"
  [lime]="84cc16"   [green]="22c55e"   [emerald]="10b981" [teal]="14b8a6"
  [cyan]="06b6d4"   [sky]="0ea5e9"     [blue]="3b82f6"    [indigo]="6366f1"
  [violet]="8b5cf6"  [purple]="a855f7"  [fuchsia]="d946ef" [pink]="ec4899"
  [rose]="f43f5e"   [slate]="64748b"   [gray]="6b7280"
)

# ── Color math (all via awk for float support) ──

hex2dec() {
  printf "%d" "0x$1"
}

hex_to_hsl() {
  local hex="${1#\#}"
  local r_dec=$(hex2dec "${hex:0:2}")
  local g_dec=$(hex2dec "${hex:2:2}")
  local b_dec=$(hex2dec "${hex:4:2}")
  awk -v r_in="$r_dec" -v g_in="$g_dec" -v b_in="$b_dec" 'BEGIN {
    r = r_in / 255
    g = g_in / 255
    b = b_in / 255
    max = r; if (g > max) max = g; if (b > max) max = b
    min = r; if (g < min) min = g; if (b < min) min = b
    l = (max + min) / 2
    if (max == min) { h = 0; s = 0 }
    else {
      d = max - min
      s = (l > 0.5) ? d / (2 - max - min) : d / (max + min)
      if (max == r) h = (g - b) / d + (g < b ? 6 : 0)
      else if (max == g) h = (b - r) / d + 2
      else h = (r - g) / d + 4
      h = h / 6
    }
    printf "%d %d %d\n", int(h * 360 + 0.5), int(s * 100 + 0.5), int(l * 100 + 0.5)
  }'
}

hsl_to_hex() {
  local h="$1" s="$2" l="$3"
  awk -v h="$h" -v s="$s" -v l="$l" 'BEGIN {
    s = s / 100; l = l / 100
    a = s * (l < 1-l ? l : 1-l)
    for (i = 0; i < 3; i++) {
      if (i == 0) n = 0
      else if (i == 1) n = 8
      else n = 4
      k = (n + h / 30) % 12
      v1 = k - 3; v2 = 9 - k
      if (v2 < v1) v1 = v2
      if (v1 > 1) v1 = 1
      if (v1 < -1) v1 = -1
      c = l - a * v1
      if (c < 0) c = 0
      if (c > 1) c = 1
      val[i] = int(c * 255 + 0.5)
    }
    printf "%02x%02x%02x\n", val[0], val[1], val[2]
  }'
}

norm_hue() {
  awk -v h="$1" 'BEGIN { h = h % 360; if (h < 0) h += 360; printf "%d\n", h }'
}

# ── Harmony definitions ──

get_harmony_hues() {
  local h="$1" type="$2"
  case "$type" in
    complementary)
      echo "$h $(norm_hue $((h + 180)))" ;;
    analogous)
      echo "$(norm_hue $((h - 30))) $h $(norm_hue $((h + 30)))" ;;
    triadic)
      echo "$h $(norm_hue $((h + 120))) $(norm_hue $((h + 240)))" ;;
    split-complementary)
      echo "$h $(norm_hue $((h + 150))) $(norm_hue $((h + 210)))" ;;
    tetradic)
      echo "$h $(norm_hue $((h + 60))) $(norm_hue $((h + 180))) $(norm_hue $((h + 240)))" ;;
    *)
      echo ""; return 1 ;;
  esac
}

HARMONY_NAMES=(complementary analogous triadic split-complementary tetradic)

declare -A HARMONY_LABELS=(
  [complementary]="Complementary"
  [analogous]="Analogous"
  [triadic]="Triadic"
  [split-complementary]="Split-Complementary"
  [tetradic]="Tetradic (Rectangle)"
)

declare -A HARMONY_DESCS=(
  [complementary]="Opposite on the wheel — maximum contrast"
  [analogous]="Neighbors on the wheel — cohesive and calming"
  [triadic]="Three equally spaced (120°) — vibrant and balanced"
  [split-complementary]="One color + neighbors of its complement — contrast with forgiveness"
  [tetradic]="Four colors forming a rectangle — rich but needs careful balancing"
)

# ── Terminal output helpers ──

swatch() {
  local hex="${1#\#}"
  local r=$((16#${hex:0:2})) g=$((16#${hex:2:2})) b=$((16#${hex:4:2}))
  printf "\033[48;2;%d;%d;%dm    \033[0m" "$r" "$g" "$b"
}

bold()      { printf "\033[1m%s\033[0m" "$1"; }
dim()       { printf "\033[2m%s\033[0m" "$1"; }
underline() { printf "\033[1m\033[4m%s\033[0m" "$1"; }
yellow()    { printf "\033[33m%s\033[0m" "$1"; }
red()       { printf "\033[31m%s\033[0m" "$1"; }
cyan_text() { printf "\033[36m%s\033[0m" "$1"; }

# ── Help & list ──

show_help() {
  echo ""
  bold "paletta"; echo " v${VERSION} — Generate color harmony palettes from the terminal"
  echo ""
  yellow "USAGE:"; echo ""
  echo "  ./paletta.sh <color> [options]"
  echo ""
  yellow "COLOR INPUT:"; echo ""
  echo "  Hex value:    \"#3b82f6\" or \"3b82f6\""
  echo "  Named color:  blue, teal, rose, indigo, etc."
  echo ""
  yellow "OPTIONS:"; echo ""
  echo "  --json                  Output as JSON"
  echo "  --harmony <type>        Only show one harmony type"
  echo "                          (complementary, analogous, triadic, split-complementary, tetradic)"
  echo "  -s, --saturation <num>  Override saturation (0-100, default: 70)"
  echo "  -l, --lightness <num>   Override lightness (0-100, default: 55)"
  echo "  --list                  List all named colors"
  echo "  --help                  Show this help"
  echo "  --version               Show version"
  echo ""
  yellow "EXAMPLES:"; echo ""
  echo "  ./paletta.sh \"#3b82f6\""
  echo "  ./paletta.sh teal --json"
  echo "  ./paletta.sh rose --harmony complementary"
  echo "  ./paletta.sh \"#10b981\" -s 50 -l 45 --json"
  echo ""
}

show_list() {
  echo ""
  bold "Available named colors:"; echo ""
  echo ""
  for name in $(echo "${!NAMED_COLORS[@]}" | tr ' ' '\n' | sort); do
    local hex="${NAMED_COLORS[$name]}"
    read -r h s l <<< "$(hex_to_hsl "$hex")"
    printf "  %s %s  %s   hsl(%d, %d%%, %d%%)\n" \
      "$(swatch "$hex")" "$(cyan_text "$(printf '%-12s' "$name")")" "#$hex" "$h" "$s" "$l"
  done
  echo ""
}

# ── Generate & print palette ──

print_palette() {
  local base_hex="$1" sat="$2" lit="$3" harmony_type="$4"
  local label="${HARMONY_LABELS[$harmony_type]}"
  local desc="${HARMONY_DESCS[$harmony_type]}"
  local hues
  hues=$(get_harmony_hues "$base_hue" "$harmony_type")

  echo ""
  underline "$label"; echo "  $(dim "$desc")"
  for hue_val in $hues; do
    local gen_hex
    gen_hex=$(hsl_to_hex "$hue_val" "$sat" "$lit")
    printf "  %s #%s  hsl(%d, %d%%, %d%%)\n" \
      "$(swatch "$gen_hex")" "$gen_hex" "$hue_val" "$sat" "$lit"
  done
}

print_palette_json() {
  local base_hex="$1" sat="$2" lit="$3" harmony_type="$4" is_last="$5"
  local label="${HARMONY_LABELS[$harmony_type]}"
  local desc="${HARMONY_DESCS[$harmony_type]}"
  local hues
  hues=$(get_harmony_hues "$base_hue" "$harmony_type")

  printf '    {\n'
  printf '      "harmony": "%s",\n' "$harmony_type"
  printf '      "name": "%s",\n' "$label"
  printf '      "description": "%s",\n' "$desc"
  printf '      "colors": [\n'

  local hue_arr=($hues)
  local count=${#hue_arr[@]}
  for i in "${!hue_arr[@]}"; do
    local hue_val="${hue_arr[$i]}"
    local gen_hex
    gen_hex=$(hsl_to_hex "$hue_val" "$sat" "$lit")
    local comma=","
    if [[ $((i + 1)) -eq $count ]]; then comma=""; fi
    printf '        { "hex": "#%s", "hsl": "hsl(%d, %d%%, %d%%)" }%s\n' \
      "$gen_hex" "$hue_val" "$sat" "$lit" "$comma"
  done

  printf '      ]\n'
  if [[ "$is_last" == "true" ]]; then
    printf '    }\n'
  else
    printf '    },\n'
  fi
}

# ── CSS variable suggestion ──

print_css_suggestion() {
  local base_hex="$1" sat="$2" lit="$3"
  local hues
  hues=$(get_harmony_hues "$base_hue" "complementary")
  local hue_arr=($hues)

  echo ""
  dim "/* Suggested CSS variables (complementary) */"
  echo ""
  local primary secondary
  primary=$(hsl_to_hex "${hue_arr[0]}" "$sat" "$lit")
  secondary=$(hsl_to_hex "${hue_arr[1]}" "$sat" "$lit")
  dim "--color-primary: #${primary};"
  echo ""
  dim "--color-secondary: #${secondary};"
  echo ""

  local analog_hues
  analog_hues=$(get_harmony_hues "$base_hue" "analogous")
  local analog_arr=($analog_hues)
  local accent
  accent=$(hsl_to_hex "${analog_arr[2]}" "$sat" "$lit")
  dim "--color-accent: #${accent};"
  echo ""
  echo ""
}

# ── Argument parsing ──

COLOR_INPUT=""
JSON_MODE=false
HARMONY_FILTER=""
SAT=70
LIT=55

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)     show_help; exit 0 ;;
    --version|-v)  echo "paletta v${VERSION}"; exit 0 ;;
    --list)        show_list; exit 0 ;;
    --json)        JSON_MODE=true; shift ;;
    --harmony)     HARMONY_FILTER="$2"; shift 2 ;;
    -s|--saturation) SAT="$2"; shift 2 ;;
    -l|--lightness)  LIT="$2"; shift 2 ;;
    -*)            red "Error: Unknown option $1"; echo ""; show_help; exit 1 ;;
    *)
      if [[ -z "$COLOR_INPUT" ]]; then
        COLOR_INPUT="$1"
      fi
      shift ;;
  esac
done

# ── Validate input ──

if [[ -z "$COLOR_INPUT" ]]; then
  red "Error: No color provided."; echo ""
  echo "Run with --help for usage."
  exit 1
fi

base_hex=""
lower_input=$(echo "$COLOR_INPUT" | tr '[:upper:]' '[:lower:]')

if [[ -n "${NAMED_COLORS[$lower_input]+x}" ]]; then
  base_hex="${NAMED_COLORS[$lower_input]}"
else
  base_hex="${COLOR_INPUT#\#}"
fi

if [[ ! "$base_hex" =~ ^[0-9a-fA-F]{6}$ ]]; then
  red "Error: \"$COLOR_INPUT\" is not a valid hex color or named color."; echo ""
  echo "Run with --list to see available named colors."
  exit 1
fi

read -r base_hue base_sat base_lit <<< "$(hex_to_hsl "$base_hex")"

if [[ -n "$HARMONY_FILTER" ]]; then
  valid=false
  for h in "${HARMONY_NAMES[@]}"; do
    if [[ "$h" == "$HARMONY_FILTER" ]]; then valid=true; break; fi
  done
  if [[ "$valid" == false ]]; then
    red "Error: Unknown harmony \"$HARMONY_FILTER\"."; echo ""
    echo "Available: ${HARMONY_NAMES[*]}"
    exit 1
  fi
fi

if [[ -n "$HARMONY_FILTER" ]]; then
  run_harmonies=("$HARMONY_FILTER")
else
  run_harmonies=("${HARMONY_NAMES[@]}")
fi

# ── Output ──

if [[ "$JSON_MODE" == true ]]; then
  printf '{\n'
  printf '  "input": { "color": "#%s", "saturation": %d, "lightness": %d },\n' \
    "$base_hex" "$SAT" "$LIT"
  printf '  "palettes": [\n'

  total=${#run_harmonies[@]}
  for i in "${!run_harmonies[@]}"; do
    is_last="false"
    if [[ $((i + 1)) -eq $total ]]; then is_last="true"; fi
    print_palette_json "$base_hex" "$SAT" "$LIT" "${run_harmonies[$i]}" "$is_last"
  done

  printf '  ]\n'
  printf '}\n'
else
  echo ""
  printf "%s %s  hsl(%d, %d%%, %d%%)  → generating with s:%d l:%d\n" \
    "$(swatch "$base_hex")" "$(bold "Base: #$base_hex")" \
    "$base_hue" "$base_sat" "$base_lit" "$SAT" "$LIT"

  for harmony in "${run_harmonies[@]}"; do
    print_palette "$base_hex" "$SAT" "$LIT" "$harmony"
  done

  print_css_suggestion "$base_hex" "$SAT" "$LIT"
fi
