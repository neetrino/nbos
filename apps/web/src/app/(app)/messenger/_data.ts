export interface Channel {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

export interface DmUser {
  id: string;
  name: string;
  initials: string;
  online: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  initials: string;
  content: string;
  timestamp: string;
}

export const CHANNELS: Channel[] = [
  {
    id: 'ch-general',
    name: 'general',
    description: 'Company-wide discussions and updates',
    memberCount: 24,
  },
  {
    id: 'ch-project',
    name: 'project-nbos',
    description: 'NBOS platform development',
    memberCount: 8,
  },
  {
    id: 'ch-announce',
    name: 'announcements',
    description: 'Official company announcements',
    memberCount: 24,
  },
];

export const DM_USERS: DmUser[] = [
  { id: 'u-alex', name: 'Alex Morgan', initials: 'AM', online: true },
  { id: 'u-sarah', name: 'Sarah Chen', initials: 'SC', online: true },
  { id: 'u-michael', name: 'Michael Kim', initials: 'MK', online: false },
  { id: 'u-elena', name: 'Elena Volkov', initials: 'EV', online: false },
];

export const GENERAL_MESSAGES: Message[] = [
  {
    id: 'm01',
    senderId: 'u-alex',
    senderName: 'Alex Morgan',
    initials: 'AM',
    content: 'Good morning everyone! Ready for the standup?',
    timestamp: '2026-03-10T09:00:00',
  },
  {
    id: 'm02',
    senderId: 'u-sarah',
    senderName: 'Sarah Chen',
    initials: 'SC',
    content: 'Morning! Let me grab my coffee first ☕',
    timestamp: '2026-03-10T09:02:00',
  },
  {
    id: 'm03',
    senderId: 'u-michael',
    senderName: 'Michael Kim',
    initials: 'MK',
    content: 'I pushed the auth module changes yesterday. Can someone review the PR?',
    timestamp: '2026-03-10T09:15:00',
  },
  {
    id: 'm04',
    senderId: 'u-elena',
    senderName: 'Elena Volkov',
    initials: 'EV',
    content: "I'll take a look after lunch, Michael.",
    timestamp: '2026-03-10T09:20:00',
  },
  {
    id: 'm05',
    senderId: 'u-alex',
    senderName: 'Alex Morgan',
    initials: 'AM',
    content: "Great teamwork! Don't forget the retro at 3pm.",
    timestamp: '2026-03-10T09:25:00',
  },
  {
    id: 'm06',
    senderId: 'u-sarah',
    senderName: 'Sarah Chen',
    initials: 'SC',
    content: 'The new dashboard design is looking really clean. Nice job on the charts!',
    timestamp: '2026-03-10T14:30:00',
  },
  {
    id: 'm07',
    senderId: 'u-michael',
    senderName: 'Michael Kim',
    initials: 'MK',
    content: 'Thanks! I used Recharts for the visualizations — very smooth integration.',
    timestamp: '2026-03-10T14:35:00',
  },
  {
    id: 'm08',
    senderId: 'u-elena',
    senderName: 'Elena Volkov',
    initials: 'EV',
    content: 'PR approved ✅ Great work on the auth flow, very clean implementation.',
    timestamp: '2026-03-10T16:00:00',
  },
  {
    id: 'm09',
    senderId: 'u-alex',
    senderName: 'Alex Morgan',
    initials: 'AM',
    content: 'Good morning! Sprint review today at 2pm.',
    timestamp: '2026-03-11T09:00:00',
  },
  {
    id: 'm10',
    senderId: 'u-sarah',
    senderName: 'Sarah Chen',
    initials: 'SC',
    content: "Got it! I'll prepare the demo for the messenger feature.",
    timestamp: '2026-03-11T09:05:00',
  },
  {
    id: 'm11',
    senderId: 'u-michael',
    senderName: 'Michael Kim',
    initials: 'MK',
    content: "I'll cover the API endpoints and the real-time sync progress.",
    timestamp: '2026-03-11T09:10:00',
  },
  {
    id: 'm12',
    senderId: 'u-elena',
    senderName: 'Elena Volkov',
    initials: 'EV',
    content: 'The test coverage for the CRM module just hit 85% 🎉',
    timestamp: '2026-03-11T10:30:00',
  },
  {
    id: 'm13',
    senderId: 'u-alex',
    senderName: 'Alex Morgan',
    initials: 'AM',
    content: "Amazing — that's a 20% improvement from last sprint.",
    timestamp: '2026-03-11T10:32:00',
  },
  {
    id: 'm14',
    senderId: 'u-sarah',
    senderName: 'Sarah Chen',
    initials: 'SC',
    content: 'Has anyone looked into the Vercel deployment issues from yesterday?',
    timestamp: '2026-03-11T11:00:00',
  },
  {
    id: 'm15',
    senderId: 'u-michael',
    senderName: 'Michael Kim',
    initials: 'MK',
    content: 'Yes, it was a build cache issue. Already fixed and redeployed.',
    timestamp: '2026-03-11T11:05:00',
  },
];

export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getDateLabel(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
