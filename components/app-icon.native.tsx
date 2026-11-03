import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react-native";
import type { StyleProp, ViewStyle } from "react-native";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
import ArrowUpRight from "lucide-react-native/icons/arrow-up-right";
import Bell from "lucide-react-native/icons/bell";
import Bookmark from "lucide-react-native/icons/bookmark";
import BookmarkCheck from "lucide-react-native/icons/bookmark-check";
import BookmarkMinus from "lucide-react-native/icons/bookmark-minus";
import BadgeInfo from "lucide-react-native/icons/badge-info";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Clock3 from "lucide-react-native/icons/clock-3";
import X from "lucide-react-native/icons/x";
import House from "lucide-react-native/icons/house";
import Eye from "lucide-react-native/icons/eye";
import EyeOff from "lucide-react-native/icons/eye-off";
import Send from "lucide-react-native/icons/send";
import Download from "lucide-react-native/icons/download";
import Layers from "lucide-react-native/icons/layers";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import LayoutGrid from "lucide-react-native/icons/layout-grid";
import Smartphone from "lucide-react-native/icons/smartphone";
import Dice6 from "lucide-react-native/icons/dice-6";
import Shuffle from "lucide-react-native/icons/shuffle";
import Sun from "lucide-react-native/icons/sun";
import MessageCircle from "lucide-react-native/icons/message-circle";
import Lock from "lucide-react-native/icons/lock";
import LockOpen from "lucide-react-native/icons/lock-open";
import Gauge from "lucide-react-native/icons/gauge";
import CloudOff from "lucide-react-native/icons/cloud-off";
import UserRound from "lucide-react-native/icons/user-round";
import UserRoundPen from "lucide-react-native/icons/user-round-pen";
import Settings from "lucide-react-native/icons/settings";
import Copy from "lucide-react-native/icons/copy";
import Trash from "lucide-react-native/icons/trash";
import FileText from "lucide-react-native/icons/file-text";
import Flame from "lucide-react-native/icons/flame";
import Globe from "lucide-react-native/icons/globe";
import Heart from "lucide-react-native/icons/heart";
import RotateCw from "lucide-react-native/icons/rotate-cw";
import Link from "lucide-react-native/icons/link";
import Film from "lucide-react-native/icons/film";
import ExternalLink from "lucide-react-native/icons/external-link";
import Ellipsis from "lucide-react-native/icons/ellipsis";
import Search from "lucide-react-native/icons/search";
import LogOut from "lucide-react-native/icons/log-out";
import Play from "lucide-react-native/icons/play";
import CirclePlay from "lucide-react-native/icons/circle-play";
import Reply from "lucide-react-native/icons/reply";
import Rewind from "lucide-react-native/icons/rewind";
import FastForward from "lucide-react-native/icons/fast-forward";
import SlidersHorizontal from "lucide-react-native/icons/sliders-horizontal";
import ShieldCheck from "lucide-react-native/icons/shield-check";
import Star from "lucide-react-native/icons/star";

export type AppIconName = string;

const ICONS: Record<string, ComponentType<LucideProps>> = {
  "arrow-left": ArrowLeft,
  "arrow-top-right": ArrowUpRight,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronLeft,
  "chevron-down": ChevronDown,
  magnify: Search,
  home: House,
  "home-variant-outline": House,
  play: Play,
  "play-circle": CirclePlay,
  "play-circle-outline": CirclePlay,
  fire: Flame,
  sync: RotateCw,
  refresh: RotateCw,
  "tune-variant": SlidersHorizontal,
  "link-variant": Link,
  "share-variant": ArrowUpRight,
  "open-in-new": ExternalLink,
  "content-copy": Copy,
  sleep: Clock3,
  close: X,
  "eye-off-outline": EyeOff,
  "eye-outline": Eye,
  eye: Eye,
  send: Send,
  "reply-outline": Reply,
  reply: Reply,
  "trash-can-outline": Trash,
  "clock-outline": Clock3,
  "clock-counter": Clock3,
  download: Download,
  "rewind-10": Rewind,
  "fast-forward": FastForward,
  "fast-forward-10": FastForward,
  layers: Layers,
  bell: Bell,
  "bell-outline": Bell,
  bookmark: Bookmark,
  "bookmark-remove-outline": BookmarkMinus,
  "bookmark-multiple-outline": BookmarkCheck,
  "cog-outline": Settings,
  heart: Heart,
  "heart-outline": Heart,
  "account-edit-outline": UserRoundPen,
  account: UserRound,
  "account-circle-outline": UserRound,
  "movie-open-outline": Film,
  "cloud-offline-outline": CloudOff,
  calendar: CalendarDays,
  "calendar-blank-outline": CalendarDays,
  "view-grid-outline": LayoutGrid,
  "delete-forever-outline": Trash,
  logout: LogOut,
  "cellphone-arrow-down": Smartphone,
  dice: Dice6,
  shuffle: Shuffle,
  globe: Globe,
  star: Star,
  "brightness-6": Sun,
  "comment-outline": MessageCircle,
  history: Clock3,
  lock: Lock,
  "lock-open-outline": LockOpen,
  options: Ellipsis,
  shield: ShieldCheck,
  "subtitles-outline": FileText,
  "play-speed": Gauge,
  information: BadgeInfo,
  "file-document-outline": FileText,
};

export function AppIcon({
  name,
  size = 20,
  color,
  style,
}: {
  name: AppIconName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const Icon = ICONS[name] ?? BadgeInfo;
  return <Icon size={size} color={color} strokeWidth={2} style={style} />;
}
