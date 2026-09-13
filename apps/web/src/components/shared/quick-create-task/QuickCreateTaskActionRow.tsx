'use client';

import type { RefObject } from 'react';
import { Paperclip, ListChecks, FolderKanban, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  RELATION_PICKER_CHIP_SHELL_CLASS,
  RELATION_PICKER_CHIP_STACK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { TaskDeliveryContextSearch } from '@/features/tasks/components/TaskDeliveryContextSearch';
import { LinkedContextChip } from '@/features/tasks/components/TaskLinkedContextChip';
import {
  encodeTaskDeliveryContextValue,
  type TaskDeliveryContextOption,
} from '@/features/tasks/utils/search-task-delivery-context';
import { cn } from '@/lib/utils';
import {
  QUICK_CREATE_TASK_ACTION_BTN_CLASS,
  QUICK_CREATE_TASK_ACTION_ROW_CLASS,
  QUICK_CREATE_TASK_PROJECT_POPOVER_CLASS,
  QUICK_CREATE_TASK_PROJECT_RESULTS_CLASS,
} from './quick-create-task-constants';
import {
  encodeQuickCreateDraftLinkValue,
  type QuickCreateDraftLink,
} from './quick-create-task-extras';

interface QuickCreateTaskActionButtonsProps {
  disabled: boolean;
  filesCount: number;
  checklistCount: number;
  projectOpen: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFilesPicked: (files: File[]) => void;
  onOpenChecklists: () => void;
  onProjectOpenChange: (open: boolean) => void;
  linkedValues: ReadonlySet<string>;
  onSelectContext: (option: TaskDeliveryContextOption) => void;
}

export function QuickCreateTaskActionButtons({
  disabled,
  filesCount,
  checklistCount,
  projectOpen,
  fileInputRef,
  onFilesPicked,
  onOpenChecklists,
  onProjectOpenChange,
  linkedValues,
  onSelectContext,
}: QuickCreateTaskActionButtonsProps) {
  const t = useTranslations('forms');
  const fileLabel = filesCount > 0 ? `${t('task.files')} · ${filesCount}` : t('task.files');
  const checklistLabel =
    checklistCount > 0 ? `${t('task.checklists')} · ${checklistCount}` : t('task.checklists');

  return (
    <div className={QUICK_CREATE_TASK_ACTION_ROW_CLASS}>
      <HiddenFileInput
        fileInputRef={fileInputRef}
        disabled={disabled}
        onFilesPicked={onFilesPicked}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={QUICK_CREATE_TASK_ACTION_BTN_CLASS}
        disabled={disabled}
        onClick={() => {
          onProjectOpenChange(false);
          fileInputRef.current?.click();
        }}
      >
        <Paperclip size={16} aria-hidden />
        {fileLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={QUICK_CREATE_TASK_ACTION_BTN_CLASS}
        disabled={disabled}
        onClick={() => {
          onProjectOpenChange(false);
          onOpenChecklists();
        }}
      >
        <ListChecks size={16} aria-hidden />
        {checklistLabel}
      </Button>
      <ProjectSearchPopover
        disabled={disabled}
        open={projectOpen}
        linkedValues={linkedValues}
        onOpenChange={onProjectOpenChange}
        onSelect={onSelectContext}
      />
    </div>
  );
}

function HiddenFileInput({
  fileInputRef,
  disabled,
  onFilesPicked,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onFilesPicked: (files: File[]) => void;
}) {
  return (
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      multiple
      disabled={disabled}
      onChange={(event) => {
        onFilesPicked(Array.from(event.target.files ?? []));
        event.target.value = '';
      }}
    />
  );
}

function ProjectSearchPopover({
  disabled,
  open,
  linkedValues,
  onOpenChange,
  onSelect,
}: {
  disabled: boolean;
  open: boolean;
  linkedValues: ReadonlySet<string>;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: TaskDeliveryContextOption) => void;
}) {
  const t = useTranslations('forms');
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={QUICK_CREATE_TASK_ACTION_BTN_CLASS}
            aria-expanded={open}
          />
        }
      >
        <FolderKanban size={16} aria-hidden />
        {t('task.project')}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className={QUICK_CREATE_TASK_PROJECT_POPOVER_CLASS}
      >
        <TaskDeliveryContextSearch
          trigger="none"
          open
          closeOnOutside={false}
          resultsPlacement="flow"
          resultsListClassName={QUICK_CREATE_TASK_PROJECT_RESULTS_CLASS}
          disabled={disabled}
          linkedValues={linkedValues}
          onOpenChange={onOpenChange}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

export function QuickCreateTaskSelectionChips({
  files,
  links,
  disabled,
  onRemoveFile,
  onUnlink,
}: {
  files: readonly File[];
  links: readonly QuickCreateDraftLink[];
  disabled: boolean;
  onRemoveFile: (index: number) => void;
  onUnlink: (value: string) => void;
}) {
  if (files.length === 0 && links.length === 0) return null;
  return (
    <div className="mt-2 w-full min-w-0">
      {files.length > 0 ? (
        <StagedFileList files={files} disabled={disabled} onRemove={onRemoveFile} />
      ) : null}
      {links.length > 0 ? (
        <ul className={cn(RELATION_PICKER_CHIP_STACK_CLASS, files.length > 0 ? 'mt-2' : undefined)}>
          {links.map((link) => (
            <LinkedContextChip
              key={encodeQuickCreateDraftLinkValue(link)}
              kind={link.kind}
              label={link.label}
              contextLabel={link.contextLabel}
              locked={disabled}
              onOpen={() => undefined}
              onUnlink={() => onUnlink(encodeTaskDeliveryContextValue(link.kind, link.entityId))}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StagedFileList({
  files,
  disabled,
  onRemove,
}: {
  files: readonly File[];
  disabled: boolean;
  onRemove: (index: number) => void;
}) {
  const t = useTranslations('forms');
  return (
    <ul className={RELATION_PICKER_CHIP_STACK_CLASS}>
      {files.map((file, index) => (
        <li
          key={`${file.name}-${file.size}-${file.lastModified}`}
          className={RELATION_PICKER_CHIP_SHELL_CLASS}
        >
          <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
          {disabled ? null : (
            <button
              type="button"
              className={cn(DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS, 'shrink-0')}
              aria-label={t('task.removeFileAria', { name: file.name })}
              onClick={() => onRemove(index)}
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
