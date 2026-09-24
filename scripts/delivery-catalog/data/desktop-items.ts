import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Десктоп. Сам продукт приближается к ближайшему стандартному типу и размеру — решение владельца;
 * здесь только работы, которых в вебе и в мобильном приложении не бывает.
 */
export const DESKTOP_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'DSK_APP_PACKAGING',
    category: 'desktop',
    iconKey: 'Monitor',
    title: 'Desktop application packaging',
    summary: 'An installer for Windows or macOS.',
    scopeBoundaries:
      'One platform, installer and signing, icons and metadata, and installation validation on a clean system.',
    units: { BACKEND: 8, FRONTEND: 10, PM: 3, DESIGNER: 2, QA: 5, TECHNICAL_SPECIALIST: 8 },
  },
  {
    code: 'DSK_AUTO_UPDATE',
    category: 'desktop',
    iconKey: 'RefreshCw',
    title: 'Desktop automatic updates',
    summary: 'Version updates without reinstallation.',
    scopeBoundaries:
      'Update channel, signature validation, rollback on failure, and offline behavior.',
    units: { BACKEND: 10, FRONTEND: 10, PM: 2, QA: 5, TECHNICAL_SPECIALIST: 6 },
  },
  {
    code: 'DSK_LOCAL_DATABASE',
    category: 'desktop',
    iconKey: 'Database',
    title: 'Desktop local database and synchronization',
    summary: 'Local data with server synchronization.',
    scopeBoundaries:
      'Local storage, synchronization and conflicts, local schema migrations, and on-device data volume.',
    units: { BACKEND: 20, FRONTEND: 22, PM: 4, QA: 8 },
  },
  {
    code: 'DSK_HARDWARE_PERIPHERALS',
    category: 'desktop',
    iconKey: 'Plug',
    title: 'Desktop hardware integration',
    summary: 'Scanners, scales, printers, and terminals.',
    scopeBoundaries:
      'Agreed devices and protocols, disconnection handling, and validation on real hardware.',
    units: { BACKEND: 14, FRONTEND: 12, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 10 },
  },
  {
    code: 'DSK_OFFLINE_POS',
    category: 'desktop',
    iconKey: 'Store',
    title: 'Offline point of sale',
    summary: 'Sales when the server connection is unavailable.',
    scopeBoundaries:
      'Offline operation, local operation queue, submission after reconnection, and duplicate and discrepancy control.',
    units: { BACKEND: 22, FRONTEND: 24, PM: 4, QA: 10, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'DSK_SYSTEM_TRAY_AGENT',
    category: 'desktop',
    iconKey: 'CircuitBoard',
    title: 'Desktop system tray agent',
    summary: 'An auto-starting system tray service.',
    scopeBoundaries:
      'Auto-start, tray icon and menu, background tasks, operation log, and graceful shutdown.',
    units: { BACKEND: 12, FRONTEND: 10, PM: 2, QA: 5, TECHNICAL_SPECIALIST: 6 },
  },
  {
    code: 'DSK_MULTI_WINDOW',
    category: 'desktop',
    iconKey: 'Layout',
    title: 'Desktop multi-window interface',
    summary: 'Multiple windows and panels at the same time.',
    scopeBoundaries:
      'Agreed windows, saved size and position, cross-window data exchange, and multi-monitor behavior.',
    units: { FRONTEND: 20, BACKEND: 4, PM: 2, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'DSK_FILE_SYSTEM_ACCESS',
    category: 'desktop',
    iconKey: 'HardDrive',
    title: 'Desktop file system access',
    summary: 'Reading and writing local folders and documents.',
    scopeBoundaries:
      'Agreed operations and directories, permissions, locked-file handling, and path security.',
    units: { BACKEND: 10, FRONTEND: 12, PM: 2, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
] as const;
