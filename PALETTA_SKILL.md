# Paletta — Claude Code Skill

## What this is

A color palette generator for UI development. Use it when you need to pick colors for a new UI, landing page, component, or any design work. It generates palettes based on color theory (complementary, analogous, triadic, split-complementary, tetradic) from any base color.

## When to use this

- User asks you to "build a dashboard", "make a landing page", "create a component" — run this BEFORE writing any CSS to establish a cohesive palette
- User provides a brand color and wants a full palette around it
- User says "make it look good" or "pick some colors" — use this to generate options, then present them
- User wants to explore color options — run multiple harmonies and show the results
- Anytime you're about to write `--color-primary` or pick hex values from memory

## How to use it

The CLI lives at the project root: `./paletta.sh`

### Quick palette generation

```bash
# All harmonies for a hex color
./paletta.sh "#3b82f6"

# JSON output (best for parsing)
./paletta.sh "#3b82f6" --json

# Specific harmony type
./paletta.sh "#3b82f6" --harmony triadic --json

# Named colors work too
./paletta.sh teal --json
./paletta.sh rose --harmony analogous --json

# Custom saturation and lightness for muted/vibrant palettes
./paletta.sh "#3b82f6" -s 50 -l 45 --json    # muted, professional
./paletta.sh "#3b82f6" -s 85 -l 60 --json    # vibrant, energetic
./paletta.sh "#3b82f6" -s 30 -l 40 --json    # desaturated, moody
```

### Available harmony types

- `complementary` — 2 colors, opposite on wheel, maximum contrast
- `analogous` — 3 colors, neighbors on wheel, cohesive and calming
- `triadic` — 3 colors, evenly spaced, vibrant and balanced
- `split-complementary` — 3 colors, contrast with forgiveness
- `tetradic` — 4 colors, rectangle on wheel, rich palette

### Available named colors

red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose, slate, gray

### JSON output structure

```json
{
  "input": { "color": "#3b82f6", "saturation": 70, "lightness": 55 },
  "palettes": [
    {
      "harmony": "complementary",
      "name": "Complementary",
      "description": "Opposite on the wheel — maximum contrast",
      "colors": [
        { "hex": "#2b7de2", "hsl": "hsl(217, 70%, 55%)" },
        { "hex": "#e2822b", "hsl": "hsl(37, 70%, 55%)" }
      ]
    }
  ]
}
```

## Recommended workflow

### 1. When a user asks to build a UI

```bash
# Generate a few palette options
./paletta.sh blue --json
./paletta.sh "#3b82f6" --harmony triadic -s 50 -l 45 --json
./paletta.sh "#3b82f6" --harmony split-complementary --json
```

Present the options to the user: "Here are three palette directions — which feels right for your project?"

### 2. Once a palette is chosen, apply the 60-30-10 rule

- **60% dominant** → backgrounds, large surfaces (use the first color, often lightened)
- **30% secondary** → supporting elements, cards, secondary buttons
- **10% accent** → CTAs, highlights, interactive elements

### 3. Generate shades from the chosen palette

The tool gives you base colors. For a full design system, derive shades:

Run the tool with different lightness values to get a scale:

```bash
./paletta.sh "#3b82f6" --harmony complementary -s 70 -l 95 --json  # light tints
./paletta.sh "#3b82f6" --harmony complementary -s 70 -l 55 --json  # base
./paletta.sh "#3b82f6" --harmony complementary -s 70 -l 25 --json  # dark shades
```

## Tips

- Saturation 40-60 looks professional; 70+ looks energetic; 20-35 looks moody
- Lightness 45-60 is the sweet spot for base UI colors
- Always pair with a near-white and near-black neutral derived from the same hue family
- When in doubt, start with `analogous` — it is the hardest to mess up
