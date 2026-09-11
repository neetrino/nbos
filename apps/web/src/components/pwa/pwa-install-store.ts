import { STANDALONE_DISPLAY_MEDIA_QUERY } from './pwa-constants';
import {
  isIosWebKit,
  isStandaloneDisplay,
  readSafariStandalone,
  type BeforeInstallPromptEvent,
} from './pwa-runtime';

type InstallPromptListener = () => void;

const installPromptListeners = new Set<InstallPromptListener>();

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedThisSession = false;
let promptListenersBound = false;

function notifyInstallPromptListeners(): void {
  for (const listener of installPromptListeners) listener();
}

function onBeforeInstallPrompt(event: Event): void {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  notifyInstallPromptListeners();
}

function onAppInstalled(): void {
  deferredPrompt = null;
  installedThisSession = true;
  notifyInstallPromptListeners();
}

function bindInstallPromptListeners(): void {
  if (promptListenersBound) return;
  promptListenersBound = true;
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
}

export function subscribeStandaloneDisplay(onStoreChange: () => void): () => void {
  const media = window.matchMedia(STANDALONE_DISPLAY_MEDIA_QUERY);
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

export function getStandaloneDisplaySnapshot(): boolean {
  return isStandaloneDisplay(
    window.matchMedia(STANDALONE_DISPLAY_MEDIA_QUERY).matches,
    readSafariStandalone(navigator),
  );
}

export function getStandaloneDisplayServerSnapshot(): boolean {
  return false;
}

export function subscribeIosWebKit(): () => void {
  return () => undefined;
}

export function getIosWebKitSnapshot(): boolean {
  return isIosWebKit(navigator.userAgent, navigator.maxTouchPoints);
}

export function getIosWebKitServerSnapshot(): boolean {
  return false;
}

export function subscribeInstallPrompt(onStoreChange: () => void): () => void {
  bindInstallPromptListeners();
  installPromptListeners.add(onStoreChange);
  return () => {
    installPromptListeners.delete(onStoreChange);
  };
}

export function getInstallPromptSnapshot(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function getInstallPromptServerSnapshot(): BeforeInstallPromptEvent | null {
  return null;
}

export function subscribeInstalledThisSession(onStoreChange: () => void): () => void {
  return subscribeInstallPrompt(onStoreChange);
}

export function getInstalledThisSessionSnapshot(): boolean {
  return installedThisSession;
}

export function getInstalledThisSessionServerSnapshot(): boolean {
  return false;
}

export async function promptDeferredInstall(): Promise<void> {
  const event = deferredPrompt;
  if (!event) return;
  await event.prompt();
  deferredPrompt = null;
  notifyInstallPromptListeners();
}
