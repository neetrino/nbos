'use client';

import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, FileText, Folder, FolderPlus, HardDrive, Loader2, Upload } from 'lucide-react';
import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EntityDetailSheetContent, DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared';
import { SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';
import { Sheet } from '@/components/ui/sheet';
import { DriveCreateFolderDialog } from '@/features/drive/DriveFolderActionDialogs';
import { buildDriveHrefWithWorkSpace } from '@/features/drive/drive-deep-link';
import { buildDriveFileHref } from '@/features/drive/drive-file-links';
import { formatFileSize } from '@/features/drive/drive-format';
import { cn } from '@/lib/utils';
import type { DriveFolder, FileAsset } from '@/lib/api/drive';
import { WorkSpaceDriveFloatingRail } from './WorkSpaceDriveFloatingRail';
import { useWorkSpaceDriveBrowser } from './use-work-space-drive-browser';

/** Matches `SheetContent` width and `floatingRailAnchorClassName`. */
const WORKSPACE_DRIVE_SHEET_WIDTH_CLASS = 'sm:data-[side=right]:w-[min(92vw,52rem)]';
const WORKSPACE_DRIVE_RAIL_ANCHOR_CLASS = `${SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS} sm:right-[min(92vw,52rem)]`;

export function WorkSpaceDriveSheet({
  open,
  onOpenChange,
  workSpaceId,
  workSpaceName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workSpaceId: string;
  workSpaceName: string;
}) {
  const t = useTranslations('workSpaces');
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const browser = useWorkSpaceDriveBrowser(workSpaceId, open);
  const driveHref = buildDriveHrefWithWorkSpace(workSpaceId);
  const workSpacePageHref = `/work-spaces/${encodeURIComponent(workSpaceId)}`;

  async function onUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    await browser.uploadFiles(files);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          contentClassName={cn(
            'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[85vw] sm:max-w-none',
            WORKSPACE_DRIVE_SHEET_WIDTH_CLASS,
          )}
          railAnchorClassName={WORKSPACE_DRIVE_RAIL_ANCHOR_CLASS}
          floatingRailContent={
            <WorkSpaceDriveFloatingRail
              workSpacePageHref={workSpacePageHref}
              driveHref={driveHref}
            />
          }
          showRailActions={false}
        >
          <header className="border-border bg-background shrink-0 border-b px-5 pt-4 pb-3">
            <p className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-0.5')}>{t('drive.title')}</p>
            <h2 className="text-foreground truncate text-lg font-semibold tracking-tight">
              {workSpaceName}
            </h2>
          </header>

          <div className="border-border bg-muted/25 flex items-center gap-1 border-b px-3 py-2">
            <WorkSpaceDriveToolbarButton
              label={t('drive.newFolder')}
              disabled={browser.busy || !browser.folderScope}
              onClick={() => setCreateFolderOpen(true)}
            >
              <FolderPlus className="size-4" aria-hidden />
            </WorkSpaceDriveToolbarButton>
            <WorkSpaceDriveToolbarButton
              label={t('drive.uploadFiles')}
              disabled={browser.busy || !browser.folderScope}
              onClick={() => uploadInputRef.current?.click()}
            >
              <Upload className="size-4" aria-hidden />
            </WorkSpaceDriveToolbarButton>
            <input
              ref={uploadInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={(event) => void onUploadChange(event)}
            />
          </div>

          <WorkSpaceDriveBreadcrumb
            trail={browser.folderTrail}
            onRoot={browser.goToRoot}
            onTrailIndex={browser.goToTrailIndex}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-4 py-3">
              {browser.loading ? (
                <p className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t('drive.loading')}
                </p>
              ) : browser.folders.length === 0 && browser.files.length === 0 ? (
                <div className="border-border/80 bg-muted/15 text-muted-foreground rounded-2xl border border-dashed px-4 py-10 text-center text-sm">
                  <HardDrive className="text-muted-foreground/70 mx-auto mb-3 size-8" aria-hidden />
                  <p className="text-foreground font-medium">{t('drive.emptyTitle')}</p>
                  <p className="mt-1 text-xs">{t('drive.emptyDescription')}</p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {browser.folders.map((folder) => (
                    <WorkSpaceDriveFolderRow
                      key={folder.id}
                      folder={folder}
                      onOpen={() => browser.openFolder(folder)}
                    />
                  ))}
                  {browser.files.map((file) => (
                    <WorkSpaceDriveFileRow key={file.id} file={file} />
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>

          <footer className="border-border bg-muted/15 shrink-0 border-t px-4 py-3">
            <Button
              type="button"
              className="h-11 w-full gap-2 rounded-2xl text-sm font-medium shadow-sm"
              onClick={() => window.open(driveHref, '_blank', 'noopener,noreferrer')}
            >
              <HardDrive className="size-4" aria-hidden />
              {t('drive.openInDrive')}
            </Button>
          </footer>
        </EntityDetailSheetContent>
      </Sheet>

      <DriveCreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onSubmit={browser.createFolder}
      />
    </>
  );
}

function WorkSpaceDriveToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      className="text-muted-foreground hover:text-foreground size-9 rounded-xl"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function WorkSpaceDriveBreadcrumb({
  trail,
  onRoot,
  onTrailIndex,
}: {
  trail: DriveFolder[];
  onRoot: () => void;
  onTrailIndex: (index: number) => void;
}) {
  const t = useTranslations('workSpaces');
  return (
    <nav
      className="border-border text-muted-foreground flex flex-wrap items-center gap-1 border-b px-4 py-2 text-xs"
      aria-label={t('drive.folderPathAria')}
    >
      <button
        type="button"
        className="hover:text-foreground rounded-md px-1 py-0.5 font-medium transition-colors"
        onClick={onRoot}
      >
        {t('drive.root')}
      </button>
      {trail.map((folder, index) => (
        <span key={folder.id} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
          <button
            type="button"
            className="hover:text-foreground max-w-[120px] truncate rounded-md px-1 py-0.5 transition-colors"
            onClick={() => onTrailIndex(index)}
          >
            {folder.name}
          </button>
        </span>
      ))}
    </nav>
  );
}

function WorkSpaceDriveFolderRow({ folder, onOpen }: { folder: DriveFolder; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        className="border-border/70 bg-card/50 hover:bg-muted/40 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors"
        onClick={onOpen}
      >
        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Folder className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">{folder.name}</span>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </button>
    </li>
  );
}

function WorkSpaceDriveFileRow({ file }: { file: FileAsset }) {
  const locale = useLocale();
  const updatedAt = file.updatedAt
    ? new Date(file.updatedAt).toLocaleDateString(resolveDatePickerLocale(locale), {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '–';

  return (
    <li>
      <Link
        href={buildDriveFileHref(file.id)}
        className="border-border/70 bg-card/50 hover:bg-muted/40 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors"
      >
        <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <FileText className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{file.displayName}</span>
          <span className="text-muted-foreground mt-0.5 block text-xs">
            {formatFileSize(file.sizeBytes)} · {updatedAt}
          </span>
        </span>
      </Link>
    </li>
  );
}
