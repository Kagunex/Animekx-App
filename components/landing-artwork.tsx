import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, Polygon, Rect, Stop } from "react-native-svg";

/** Original vector artwork made for AnimeKz. No remote or traced imagery. */
export function HeroAnimeIllustration({ width = 350, height = 390 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 420 470" fill="none">
      <Defs>
        <LinearGradient id="heroSky" x1="32" y1="35" x2="385" y2="430" gradientUnits="userSpaceOnUse"><Stop stopColor="#DDF0FF" /><Stop offset="1" stopColor="#A9D5FF" /></LinearGradient>
        <LinearGradient id="heroHair" x1="138" y1="35" x2="300" y2="215" gradientUnits="userSpaceOnUse"><Stop stopColor="#263C5A" /><Stop offset=".55" stopColor="#101D34" /><Stop offset="1" stopColor="#080F1D" /></LinearGradient>
        <LinearGradient id="heroFace" x1="157" y1="106" x2="266" y2="244" gradientUnits="userSpaceOnUse"><Stop stopColor="#FFF7EF" /><Stop offset="1" stopColor="#E8C9B8" /></LinearGradient>
        <LinearGradient id="heroJacket" x1="110" y1="294" x2="314" y2="470" gradientUnits="userSpaceOnUse"><Stop stopColor="#FFFFFF" /><Stop offset="1" stopColor="#D9ECFF" /></LinearGradient>
        <LinearGradient id="heroEye" x1="0" y1="0" x2="0" y2="1"><Stop stopColor="#75D9FF" /><Stop offset="1" stopColor="#1673D9" /></LinearGradient>
        <ClipPath id="heroClip"><Rect x="7" y="8" width="406" height="454" rx="185" /></ClipPath>
      </Defs>
      <G clipPath="url(#heroClip)">
        <Rect x="7" y="8" width="406" height="454" rx="185" fill="url(#heroSky)" />
        <Circle cx="332" cy="84" r="66" fill="#FFF" opacity=".48" />
        <Circle cx="332" cy="84" r="47" stroke="#FFF" strokeWidth="1.5" opacity=".72" />
        <Path d="M12 347 111 225l87 105 75-84 135 152v66H12v-117Z" fill="#88BDF2" opacity=".38" />
        <Path d="M18 375 112 275l62 76 78-105 155 167v61H18v-99Z" fill="#6CA9E6" opacity=".28" />
        <Path d="M36 56h42v8H36zM36 73h28v5H36zM352 235h8v40h-8zM367 235h8v27h-8zM382 235h8v34h-8z" fill="#3985F5" opacity=".45" />
        <Path d="M78 444c9-69 45-120 105-137l32 15 41-17c68 17 103 64 116 139H78Z" fill="#AFCBED" opacity=".48" />
        <Path d="M153 202h106v98c-18 22-35 32-53 32s-36-10-53-32v-98Z" fill="url(#heroFace)" />
        <Path d="M151 160c-12 2-21 13-19 28 2 15 12 25 24 26l-5-54ZM262 160c13 2 21 13 19 28-2 15-12 25-24 26l5-54Z" fill="#E9C8B7" />
        <Path d="M152 146c6-53 35-82 79-77 34 4 50 35 43 83l-9 68c-5 43-28 67-57 67-33 0-56-30-61-74l-4-67Z" fill="url(#heroFace)" />
        <Path d="M139 166c-12-42-6-84 16-111 23-29 62-36 93-16 29 19 42 56 33 103-14-8-22-21-27-39-11 15-29 23-50 26-22 3-40-1-55-10 0 19-3 34-10 47Z" fill="url(#heroHair)" />
        <Path d="M144 143c-15 32-16 70-3 105 7-15 10-32 10-54l12 16c8-26 12-48 10-70-9 8-20 9-29 3ZM269 124c16 31 21 75 8 115-7-14-11-29-13-47l-13 17c-5-28-5-51 1-71 5 10 10 14 17 15Z" fill="#111E34" />
        <Path d="M154 99c24-32 52-44 87-37-27 4-43 19-51 39 24-11 46-13 67-5-19 5-34 15-44 29-24 4-44 0-62-12l3 24-17-19 1-19 16 0Z" fill="#344A6C" />
        <Path d="M181 190c11-8 24-8 34 0-10 11-23 12-34 0ZM226 190c10-8 23-8 34 0-10 11-23 12-34 0Z" fill="#26374D" />
        <Path d="M185 193c8-5 17-5 25 0l-2 20c-7 7-16 7-22 0l-1-20ZM230 193c8-5 17-5 25 0l-2 20c-7 7-16 7-22 0l-1-20Z" fill="url(#heroEye)" />
        <Ellipse cx="198" cy="200" rx="3.5" ry="7" fill="#102B50" /><Ellipse cx="243" cy="200" rx="3.5" ry="7" fill="#102B50" />
        <Circle cx="194" cy="196" r="2.5" fill="#FFF" /><Circle cx="239" cy="196" r="2.5" fill="#FFF" />
        <Path d="m218 204-3 21 7 2" stroke="#C79583" strokeWidth="2" strokeLinecap="round" />
        <Path d="M203 242c9 5 18 5 27-1" stroke="#A7595C" strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M188 232c7 4 14 4 20 0M231 232c7 4 14 3 20-1" stroke="#E8A9A0" strokeWidth="5" strokeLinecap="round" opacity=".55" />
        <Path d="M126 326c19-20 38-34 60-42l26 22 29-22c30 8 52 23 69 43l34 138H85l41-139Z" fill="url(#heroJacket)" stroke="#9DC7F0" strokeWidth="3" />
        <Path d="m186 284 26 22-20 34-25-40 19-16ZM241 284l-29 22 21 34 24-40-16-16Z" fill="#EAF5FF" stroke="#A8CFF4" strokeWidth="2" />
        <Path d="m212 306-15 83 16 26 17-26-18-83Z" fill="#3985F5" />
        <Path d="m195 337-5 79M229 337l6 79" stroke="#88BDF2" strokeWidth="2" strokeLinecap="round" />
        <Path d="M152 330c-18 32-25 70-27 112M270 330c18 32 24 70 26 112" stroke="#FFF" strokeWidth="5" opacity=".8" />
        <Path d="M109 461h219" stroke="#3985F5" strokeWidth="3" opacity=".62" />
      </G>
      <Rect x="7.75" y="8.75" width="404.5" height="452.5" rx="184.25" stroke="#FFFFFF" strokeWidth="1.5" opacity=".9" />
      <Circle cx="62" cy="142" r="5" fill="#3985F5" /><Circle cx="348" cy="333" r="4" fill="#FFF" />
      <Polygon points="74,270 80,282 93,284 83,293 85,306 74,300 63,306 65,293 55,284 68,282" fill="#FFFFFF" opacity=".9" />
    </Svg>
  );
}

export function ChibiAnimeIllustration({ width = 160, height = 150 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 220 190" fill="none">
      <Defs>
        <LinearGradient id="chibiHair" x1="56" y1="25" x2="161" y2="149" gradientUnits="userSpaceOnUse"><Stop stopColor="#FFFFFF" /><Stop offset=".55" stopColor="#D7EEFF" /><Stop offset="1" stopColor="#90C7F3" /></LinearGradient>
        <LinearGradient id="chibiDress" x1="74" y1="116" x2="145" y2="190" gradientUnits="userSpaceOnUse"><Stop stopColor="#FFFFFF" /><Stop offset="1" stopColor="#B9DEFF" /></LinearGradient>
        <LinearGradient id="chibiEye" x1="0" y1="0" x2="0" y2="1"><Stop stopColor="#75D9FF" /><Stop offset="1" stopColor="#2676DF" /></LinearGradient>
      </Defs>
      <Circle cx="110" cy="96" r="89" fill="#D8EDFF" opacity=".75" />
      <Circle cx="110" cy="96" r="76" stroke="#FFFFFF" strokeWidth="2" opacity=".8" />
      <Path d="M67 124c-13 13-23 34-27 63h140c-5-29-15-50-28-63H67Z" fill="url(#chibiDress)" stroke="#9AC9F4" strokeWidth="3" />
      <Path d="M85 119h50v30c-8 8-17 12-25 12s-17-4-25-12v-30Z" fill="#F5D9CA" />
      <Path d="M67 78c0-33 18-54 45-54 29 0 47 22 47 56l-5 34c-5 29-22 43-43 43s-39-15-43-43l-1-36Z" fill="#FCE9DE" />
      <Path d="M62 101c-13 11-18 26-13 40 8 0 17-7 25-19l-12-21ZM162 99c13 12 19 27 14 42-9-1-18-8-26-20l12-22Z" fill="url(#chibiHair)" />
      <Path d="M63 83c-2-33 15-59 45-62 31-3 52 19 51 59-8-2-15-10-20-21-10 10-29 17-51 17-8 0-16-1-25-4Z" fill="url(#chibiHair)" stroke="#90C7F3" strokeWidth="2" />
      <Path d="M71 59c12-23 30-32 53-30-15 5-23 16-25 28 15-10 31-12 46-6-11 4-19 12-23 23-18 4-35 2-49-7l5 23-14-15 7-16Z" fill="#E8F6FF" />
      <Path d="M80 99c7-7 16-7 23 0-7 8-16 8-23 0ZM119 99c7-7 16-7 23 0-7 8-16 8-23 0Z" fill="#38536F" />
      <Ellipse cx="91" cy="103" rx="5" ry="9" fill="url(#chibiEye)" /><Ellipse cx="130" cy="103" rx="5" ry="9" fill="url(#chibiEye)" />
      <Circle cx="89" cy="99" r="2.5" fill="#FFF" /><Circle cx="128" cy="99" r="2.5" fill="#FFF" />
      <Path d="M101 119c6 5 12 5 18 0" stroke="#B56B72" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M77 114c6 3 11 3 16 0M128 114c6 3 11 3 16 0" stroke="#F0A7A3" strokeWidth="5" strokeLinecap="round" opacity=".58" />
      <Path d="M153 139c12-14 17-30 16-45-1-10 4-17 11-17s11 7 9 16c-2 10-8 19-17 28 14 0 20 4 20 11s-7 10-17 8l-18-1" fill="#FCE9DE" stroke="#E5BFB1" strokeWidth="2" />
      <Path d="M176 88c1-8 4-15 9-20M184 91c7-4 14-7 21-7M180 98c5 2 10 4 15 8" stroke="#FCE9DE" strokeWidth="6" strokeLinecap="round" />
      <Path d="m80 74-9 19M144 71l10 19" stroke="#FFF" strokeWidth="5" strokeLinecap="round" opacity=".85" />
    </Svg>
  );
}

const posterScenes = [
  { bg: "#112B54", accent: "#55C2FF", hair: "#101A2D", skin: "#F2D8C9", jacket: "#DBF0FF" },
  { bg: "#2366AE", accent: "#B8E6FF", hair: "#1A2331", skin: "#F6D6C0", jacket: "#F5FAFF" },
  { bg: "#163F71", accent: "#75C8FA", hair: "#17253C", skin: "#F2D1C0", jacket: "#C9E8FF" },
  { bg: "#204D83", accent: "#D8F1FF", hair: "#E3F4FF", skin: "#EBCDBD", jacket: "#FFFFFF" },
];

/** Four distinct original, abstract character illustrations; anime metadata remains API sourced. */
export function AnimePosterArtwork({ variant = 0, width = 150, height = 190 }: { variant?: number; width?: number; height?: number }) {
  const scene = posterScenes[((variant % posterScenes.length) + posterScenes.length) % posterScenes.length];
  const alternate = variant % 2 === 1;
  return (
    <Svg width={width} height={height} viewBox="0 0 180 230" fill="none">
      <Defs><LinearGradient id={`posterBg${variant}`} x1="0" y1="0" x2="180" y2="230" gradientUnits="userSpaceOnUse"><Stop stopColor={scene.bg} /><Stop offset="1" stopColor="#0D1D37" /></LinearGradient><LinearGradient id={`posterCoat${variant}`} x1="48" y1="145" x2="135" y2="236" gradientUnits="userSpaceOnUse"><Stop stopColor={scene.jacket} /><Stop offset="1" stopColor={scene.accent} /></LinearGradient></Defs>
      <Rect width="180" height="230" rx="18" fill={`url(#posterBg${variant})`} />
      <Circle cx={alternate ? 139 : 42} cy="44" r="28" fill={scene.accent} opacity=".25" />
      <Path d={alternate ? "M0 175 60 95l28 52 35-85 57 83v85H0v-55Z" : "M0 150 50 76l35 67 39-94 56 80v101H0v-80Z"} fill="#80BFF4" opacity=".16" />
      <Path d="M16 24h18v3H16zM16 32h10v2H16zM146 149h4v24h-4zM154 149h4v16h-4z" fill="#FFF" opacity=".55" />
      <Path d="M39 229c4-45 18-71 45-86l8 9 10-9c29 14 43 42 47 86H39Z" fill={`url(#posterCoat${variant})`} />
      <Path d="M68 88c0-26 10-42 25-42 19 0 29 18 27 43l-5 39c-3 20-12 29-23 29s-21-11-23-31l-1-38Z" fill={scene.skin} />
      <Path d={alternate ? "M64 95c-8-38 5-62 30-64 28-2 41 20 34 62-7-8-12-19-14-30-10 11-27 17-48 15l-2 17Z" : "M66 95c-7-36 7-60 31-61 26-1 38 20 30 59-7-4-13-13-16-24-9 12-24 18-43 17v9Z"} fill={scene.hair} />
      <Path d="M79 103c5-4 10-4 15 0M101 103c5-4 10-4 15 0" stroke="#243954" strokeWidth="3" strokeLinecap="round" />
      <Ellipse cx="87" cy="108" rx="3" ry="5" fill="#53B7F6" /><Ellipse cx="109" cy="108" rx="3" ry="5" fill="#53B7F6" />
      <Path d="M91 126c4 3 8 3 12 0" stroke="#B97175" strokeWidth="2" strokeLinecap="round" />
      <Path d="m83 150 10 13 10-13" stroke="#FFF" strokeWidth="3" opacity=".75" />
      <Path d="M18 207h144" stroke={scene.accent} strokeWidth="2" opacity=".7" />
      <Circle cx="147" cy="55" r="3" fill="#FFF" /><Circle cx="31" cy="124" r="2" fill={scene.accent} />
    </Svg>
  );
}
