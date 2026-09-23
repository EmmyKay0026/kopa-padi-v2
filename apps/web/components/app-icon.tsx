import {
  ArrowRight,
  ArrowUpDown,
  Bell,
  BriefcaseBusiness,
  BusFront,
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  Ellipsis,
  ExternalLink,
  FileText,
  Flag,
  GitCompareArrows,
  House,
  Info,
  Leaf,
  Link2,
  List,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Pencil,
  Phone,
  Plane,
  Plus,
  RefreshCw,
  Route,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  TriangleAlert,
  TrainFront,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";

export type AppIconName =
  | "alert"
  | "arrow"
  | "bell"
  | "bus"
  | "calendar"
  | "car"
  | "chat"
  | "check"
  | "circle"
  | "clock"
  | "close"
  | "document"
  | "edit"
  | "external"
  | "flag"
  | "gear"
  | "home"
  | "info"
  | "journey"
  | "leaf"
  | "link"
  | "list"
  | "lock"
  | "logout"
  | "match"
  | "menu"
  | "message"
  | "more"
  | "people"
  | "phone"
  | "pin"
  | "plane"
  | "plus"
  | "profile"
  | "refresh"
  | "route"
  | "search"
  | "send"
  | "settings"
  | "share"
  | "shield"
  | "swap"
  | "train"
  | "trip"
  | "user"
  | "warning"
  | "x";

const icons: Record<AppIconName, LucideIcon> = {
  alert: TriangleAlert,
  arrow: ArrowRight,
  bell: Bell,
  bus: BusFront,
  calendar: CalendarDays,
  car: CarFront,
  chat: MessageCircle,
  check: Check,
  circle: UsersRound,
  clock: Clock3,
  close: X,
  document: FileText,
  edit: Pencil,
  external: ExternalLink,
  flag: Flag,
  gear: Settings,
  home: House,
  info: Info,
  journey: CarFront,
  leaf: Leaf,
  link: Link2,
  list: List,
  lock: LockKeyhole,
  logout: LogOut,
  match: GitCompareArrows,
  menu: Menu,
  message: MessageCircle,
  more: Ellipsis,
  people: UsersRound,
  phone: Phone,
  pin: MapPin,
  plane: Plane,
  plus: Plus,
  profile: UserRound,
  refresh: RefreshCw,
  route: Route,
  search: Search,
  send: Send,
  settings: Settings,
  share: Share2,
  shield: ShieldCheck,
  swap: ArrowUpDown,
  train: TrainFront,
  trip: BriefcaseBusiness,
  user: UserRound,
  warning: TriangleAlert,
  x: X,
};

export function AppIcon({
  name,
  size = 20,
  className = "",
}: {
  name: AppIconName;
  size?: number;
  className?: string;
}) {
  const Icon = icons[name];
  return (
    <Icon
      aria-hidden="true"
      width={size}
      height={size}
      strokeWidth={1.8}
      className={className}
    />
  );
}
