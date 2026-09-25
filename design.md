# AnimeKx Design System

## Brand

- **Name:** AnimeKx
- **Tagline:** Nonton Anime, Lebih Mudah, Lebih Seru.
- **Accent:** Orange `#FF7A00`
- **Identity:** Dark premium anime streaming — content-first, modern, production-ready Android UI.

## Color tokens (`components/nothing-ui.tsx` + `providers/theme-provider.tsx`)

| Token | Value |
|---|---|
| Background | `#07080D` |
| Surface | `#0D1018` |
| Card / Raised | `#151923` |
| Elevated | `#1B202C` |
| Primary | `#FF7A00` |
| Primary Dark | `#E85F00` |
| Accent | `#FFB45C` |
| Cyan | `#27C7FF` |
| Text | `#FFFFFF` |
| Secondary text | `#A8ADBA` |
| Muted | `#6F7480` |
| Divider | `#252A35` |
| Error | `#FF4D5D` |
| Success | `#35D07F` |

Use `nothing.*` or `useThemeColors()` — avoid random hardcoded colors.

## Typography

Space Grotesk (Regular / Medium / SemiBold) already bundled.

- Hero: large, bold, tight tracking
- Section: 18–22px semibold
- Card title: 13–15px semibold
- Meta: 10–12px

## Navigation

Bottom tabs: Home · Explore · Schedule · Library · Random · Profile  
Active tab: orange accent + subtle glow background.

## Principles

1. Preserve all API, player, watch progress, library, and auth logic.
2. No fake anime data — only real AniList / backend data.
3. Package / application ID unchanged (`aniraku.anime.app`).
4. Performance: FlatList / existing rails, skeleton loading, no heavy animations.
5. Safe areas, responsive cards, no horizontal overflow.

## Components

- `AnirakuMark` / `AnimeKxLogo` — wordmark with orange **Kx**
- `AnimeRail`, `AnimeCard`, skeletons, empty/error states
- Primary buttons use orange fill + white label

