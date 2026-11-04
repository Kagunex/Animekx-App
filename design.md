# Animekz Design System

## Brand

- **Name:** Animekz
- **Tagline:** Premium Anime Streaming
- **Identity:** Light blue streaming — Neo-Brutalist details, Bento layouts, restrained Liquid Glass

## Color tokens (reference-aligned)

| Token | Value |
|---|---|
| Primary | `#8CCFFF` |
| Secondary | `#FFFFFF` |
| Accent | `#4BA3E8` |
| Background | `#F5FAFF` |
| Surface | `#FFFFFF` |
| Soft Blue | `#B9E2FF` |
| Glass Surface | `rgba(255,255,255,0.65)` |
| Border | `#263746` |
| Text | `#172B3A` |
| Secondary text | `#71869A` |
| Error | `#FF4D5D` |
| Success | `#35D07F` |

Blue marks actions, active navigation, selected episodes, progress and focus. Keep cards mostly white with pale blue supporting surfaces.

## Typography

Space Grotesk

- Hero: 24–26 Bold
- Section: 18 Semibold
- Card title: 12–13 Semibold
- Meta: 10–12 Regular/Muted

## Navigation

Floating glass pill bottom tabs: Home · Explore · Discover · My List · Profile
Active: blue selected state with a clear pill indicator
Content bottom padding ≥ 120

## Radius

- Posters: 14; cards: 20
- Buttons: 14
- Tab bar: 24
- Chips: 8–12
- Icon buttons: circle

## Principles

1. Preserve all API, player, watch progress, library, auth logic.
2. No fake anime data.
3. Android package ID is `com.animekz.app`; EAS project identity and existing deep-link scheme remain unchanged.
4. Performance: FlatList, skeleton, light press feedback.
5. Safe areas, no horizontal overflow.
6. User-facing brand: **Animekz** only (never Aniraku in UI).
7. Use firm outlines and offset shadows selectively; keep glass effects translucent and readable.

## Screens

1. Home — cinematic hero, continue watching, ranked trending, rails
2. Anime (catalog) — genre chips, 2-col grid
3. Search — recent + results
4. Detail — backdrop + poster + episodes + related
5. Watch — immersive player chrome only
6. Library — tabs + grids
7. Profile / Settings — list rows
