import {
  BrainCircuit,
  ClipboardCheck,
  Cpu,
  FileText,
  FolderKanban,
  KeyRound,
  Layers,
  ListChecks,
  MessageSquare,
  Paperclip,
  Pencil,
  Play,
  PlusSquare,
  Send,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const CAPABILITY_ICONS: Record<string, LucideIcon> = {
  'workspaces.read': Layers,
  'tasks.list': ListChecks,
  'tasks.read': FileText,
  'tasks.read_links': FolderKanban,
  'tasks.read_discussion': MessageSquare,
  'drive.read_task_artifact': Paperclip,
  'tasks.create': PlusSquare,
  'tasks.update': Pencil,
  'tasks.start': Play,
  'tasks.comment': MessageSquare,
  'tasks.submit_review': ClipboardCheck,
  'tasks.attach_artifact': Paperclip,
};

export function iconForCapabilityKey(key: string): LucideIcon {
  const exact = CAPABILITY_ICONS[key];
  if (exact) return exact;
  if (key.includes('send')) return Send;
  if (key.includes('draft')) return Sparkles;
  if (key.includes('comment') || key.includes('discussion')) return MessageSquare;
  if (key.includes('review')) return ClipboardCheck;
  return KeyRound;
}

export function iconForProvider(provider: string): LucideIcon {
  if (provider === 'ANTHROPIC') return BrainCircuit;
  if (provider === 'OPENAI') return Sparkles;
  return Cpu;
}
