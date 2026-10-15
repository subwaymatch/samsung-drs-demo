import type { CSSProperties } from 'react';
import {
  AlignJustify, AppWindow, Archive, ArrowDown, ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUp, AtSign, Ban, ChartColumn, Bell, BellRing, BookOpen, Bug,
  Calendar, CalendarClock, CalendarDays, CalendarRange, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUp,
  ChevronsUpDown, Circle, CircleCheck, CircleDot, CircleX, Clock, Columns2, Copy, CopyPlus, Cpu, Database, Ellipsis, ExternalLink, Eye, FileCode,
  FileText, Film, Filter, FilterX, Flag, FlaskConical, Gauge, GitBranch, GitCommitHorizontal, GitPullRequest, Hammer, Image, Inbox, Info,
  Keyboard, Languages, Layers, Link, Link2, ListChecks, Lock, LockOpen, LogOut, Mail, Menu, MessageSquare, Minus, PanelLeftClose,
  PanelLeftOpen, Paperclip, Pencil, Play, Plus, Printer, RefreshCw, RotateCcw, Search, Send, Settings, ShieldCheck, Sparkles, Trash2,
  TriangleAlert, User, UserCheck, UserPlus, Users, Wrench, X, type LucideIcon
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'align-justify': AlignJustify, 'app-window': AppWindow, archive: Archive, 'arrow-down': ArrowDown, 'arrow-left': ArrowLeft, 'arrow-left-right': ArrowLeftRight,
  'arrow-right': ArrowRight, 'arrow-up': ArrowUp, 'at-sign': AtSign, ban: Ban, 'bar-chart-3': ChartColumn, bell: Bell, 'bell-ring': BellRing,
  'book-open': BookOpen, bug: Bug, calendar: Calendar, 'calendar-clock': CalendarClock, 'calendar-days': CalendarDays, 'calendar-range': CalendarRange,
  check: Check, 'check-check': CheckCheck, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'chevron-up': ChevronUp, 'chevrons-up': ChevronsUp, 'chevrons-up-down': ChevronsUpDown, circle: Circle, 'circle-check': CircleCheck,
  'circle-dot': CircleDot, 'circle-x': CircleX, clock: Clock, 'columns-2': Columns2, copy: Copy, 'copy-plus': CopyPlus, cpu: Cpu, database: Database,
  ellipsis: Ellipsis, 'external-link': ExternalLink, eye: Eye, 'file-code': FileCode, 'file-text': FileText, film: Film, filter: Filter,
  'filter-x': FilterX, flag: Flag, 'flask-conical': FlaskConical, gauge: Gauge, 'git-branch': GitBranch, 'git-commit': GitCommitHorizontal,
  'git-pull-request': GitPullRequest, hammer: Hammer, image: Image, inbox: Inbox, info: Info, keyboard: Keyboard, languages: Languages,
  layers: Layers, link: Link, 'link-2': Link2, 'list-checks': ListChecks, lock: Lock, 'lock-open': LockOpen, 'log-out': LogOut, mail: Mail,
  menu: Menu, 'message-square': MessageSquare, minus: Minus, 'panel-left-close': PanelLeftClose, 'panel-left-open': PanelLeftOpen,
  paperclip: Paperclip, pencil: Pencil, play: Play, plus: Plus, printer: Printer, 'refresh-cw': RefreshCw, 'rotate-ccw': RotateCcw,
  search: Search, send: Send, settings: Settings, 'shield-check': ShieldCheck, sparkles: Sparkles, 'trash-2': Trash2,
  'triangle-alert': TriangleAlert, user: User, 'user-check': UserCheck, 'user-plus': UserPlus, users: Users, wrench: Wrench, x: X
};

export interface IconProps {
  name: string | undefined;
  size?: number;
  color?: string | null;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 16, color, strokeWidth = 1.75, className, style }: IconProps) {
  const C = name ? ICONS[name] : undefined;
  if (!C) return null;
  return <C size={size} color={color || 'currentColor'} strokeWidth={strokeWidth} aria-hidden className={className} style={{ flex: 'none', display: 'block', ...style }} />;
}
