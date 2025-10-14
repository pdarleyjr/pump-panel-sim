# PWA Icon Generation Required

The PWA requires two PNG files:
- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels

## Temporary Solution: Create Simple Colored Squares

### Option 1: Using ImageMagick (if available)

```bash
# On Windows with ImageMagick:
magick -size 192x192 canvas:#d32f2f -font Arial -pointsize 72 -fill white -gravity center -annotate +0+0 "FP" icon-192.png
magick -size 512x512 canvas:#d32f2f -font Arial -pointsize 192 -fill white -gravity center -annotate +0+0 "FP" icon-512.png
```

### Option 2: Using Online Tools

Visit [favicon.io](https://favicon.io/favicon-generator/) or similar:
1. Create a simple red (#d32f2f) square with "FP" text
2. Generate 192x192 and 512x512 versions
3. Save as `icon-192.png` and `icon-512.png` in this directory

### Option 3: Manual Creation

Use any image editor (GIMP, Photoshop, Paint.NET):
1. Create 192x192 pixel canvas with red background (#d32f2f)
2. Add white "FP" text centered
3. Export as `icon-192.png`
4. Repeat for 512x512 as `icon-512.png`

## Design Recommendations

For a professional icon:
- Use fire pump panel imagery
- Include Pierce branding if licensed
- Maintain red/white color scheme (#d32f2f theme)
- Ensure text is readable at small sizes
- Use high contrast for visibility