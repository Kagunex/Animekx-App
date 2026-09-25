# Animekz Design System

## Brand

- **Name:** Animekz
- **Tagline:** Premium Anime Streaming
- **Identity:** Dark cinematic streaming — Netflix-style UX, original Animekz brand

## Color tokens (reference-aligned)

| Token | Value |
|---|---|
| Primary | `#FF6A00` |
| Secondary | `#FFA726` |
| Background | `#0B0F14` |
| Surface | `#0F141C` |
| Raised / Card | `#141A22` |
| Elevated | `#1A222D` |
| Text | `#FFFFFF` |
| Secondary text | `#A0A7B3` |
| Muted | `#6B7380` |
| Divider | `#243040` |
| Error | `#FF4D5D` |
| Success | `#35D07F` |

Orange only for: CTA, active nav, selected episode, progress, rating badge, focus.

## Typography

Space Grotesk

- Hero: 24–26 Bold
- Section: 18 Semibold
- Card title: 12–13 Semibold
- Meta: 10–12 Regular/Muted

## Navigation

Floating pill bottom tabs: Beranda · Anime · Jadwal · Library · Profil  
Active: orange + soft pill glow  
Content bottom padding ≥ 120

## Radius

- Posters / cards: 14
- Buttons: 14
- Tab bar: 24
- Chips: 8–12
- Icon buttons: circle

## Principles

1. Preserve all API, player, watch progress, library, auth logic.
2. No fake anime data.
3. Package ID unchanged (`aniraku.anime.app`).
4. Performance: FlatList, skeleton, light press feedback.
5. Safe areas, no horizontal overflow.
6. User-facing brand: **Animekz** only (never Aniraku in UI).

## Screens

1. Home — cinematic hero, continue watching, ranked trending, rails
2. Anime (catalog) — genre chips, 2-col grid
3. Search — recent + results
4. Detail — backdrop + poster + episodes + related
5. Watch — immersive player chrome only
6. Library — tabs + grids
7. Profile / Settings — list rows
