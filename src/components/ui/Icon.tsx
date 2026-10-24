import type { CSSProperties } from 'react';
import {
  Home, Search, MessageCircle, User, Settings, Bell, Plus,
  ArrowLeft, ChevronRight, X, Check, CheckCheck,
  Heart, Bookmark, Share2, MoreHorizontal, Send, Reply,
  FileText, Image as ImageIcon, Play, Pause, Volume2, Mic, MicOff, Video, VideoOff,
  Users, AtSign,
  Lock, Shield, Key, Ban, Filter, Eye, Info, CircleHelp,
  Globe, Clock, Mail, Phone, Database, Download,
  Crown, Pencil, Calendar, Sparkles, LogOut, ExternalLink,
  AlertCircle, Camera, ImagePlus,
  Repeat, Paperclip, Pin,
  type LucideIcon
, BarChart3 } from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  chart: BarChart3,
  home: Home,
  search: Search,
  chat: MessageCircle,
  user: User,
  gear: Settings,
  settings: Settings,
  bell: Bell,
  plus: Plus,
  back: ArrowLeft,
  chevron: ChevronRight,
  x: X,
  check: Check,
  checkcheck: CheckCheck,
  heart: Heart,
  save: Bookmark,
  share: Share2,
  more: MoreHorizontal,
  send: Send,
  reply: Reply,
  repeat: Repeat,
  doc: FileText,
  img: ImageIcon,
  play: Play,
  pause: Pause,
  spk: Volume2,
  mic: Mic,
  mic_off: MicOff,
  video: Video,
  videooff: VideoOff,
  users: Users,
  at: AtSign,
  lock: Lock,
  shield: Shield,
  key: Key,
  ban: Ban,
  filter: Filter,
  eye: Eye,
  info: Info,
  help: CircleHelp,
  globe: Globe,
  clock: Clock,
  mail: Mail,
  phone: Phone,
  db: Database,
  dl: Download,
  paperclip: Paperclip,
  pin: Pin,
  crown: Crown,
  edit: Pencil,
  calendar: Calendar,
  sparkles: Sparkles,
  logout: LogOut,
  external: ExternalLink,
  alert: AlertCircle,
  camera: Camera,
  imageplus: ImagePlus,
};

export type IconName = keyof typeof MAP;

export function Icon({
  name,
  size = 22,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const Cmp = MAP[name];
  if (!Cmp) return null;
  return <Cmp size={size} strokeWidth={1.7} className={className} style={style} aria-hidden="true" />;
}
