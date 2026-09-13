'use client';

import { useRef, useState, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { usePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import {
  QUICK_CREATE_TASK_BODY_CLASS,
  QUICK_CREATE_TASK_DESCRIPTION_INPUT_CLASS,
  QUICK_CREATE_TASK_DIALOG_CLASS,
  QUICK_CREATE_TASK_DIALOG_STACKED_CLASS,
  QUICK_CREATE_TASK_LAYER_SCRIM_CLASS,
  QUICK_CREATE_TASK_STACK_CLASS,
  QUICK_CREATE_TASK_UNDER_LAYER_CLASS,
  QUICK_CREATE_TITLE_FOCUS_DELAY_MS,
} from './quick-create-task-constants';
import { useFocusElementWhenOpen } from './use-focus-element-when-open';
import { QuickCreateTaskAutoGrowTextarea } from './QuickCreateTaskAutoGrowTextarea';
import {
  QuickCreateTaskActionButtons,
  QuickCreateTaskSelectionChips,
} from './QuickCreateTaskActionRow';
import {
  checklistDraftItemCount,
  encodeQuickCreateDraftLinkValue,
} from './quick-create-task-extras';
import { QuickCreateTaskChecklistOverlay } from './QuickCreateTaskChecklistOverlay';
import { consumeQuickCreateChecklistDismiss } from './quick-create-task-layer';
import { QuickCreateTaskFooter, QuickCreateTaskTitleRow } from './QuickCreateTaskChrome';
import { QuickCreateTaskMetaRow } from './QuickCreateTaskMetaRow';
import {
  useQuickCreateTaskForm,
  type QuickCreateTaskDialogProps,
} from './use-quick-create-task-form';

export type { QuickCreateTaskDialogProps };

export function QuickCreateTaskDialog(props: QuickCreateTaskDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const { me } = usePermission();
  const { onOpenFull, open, onOpenChange } = props;
  const form = useQuickCreateTaskForm({ ...props, me });
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  useFocusElementWhenOpen(open, titleInputRef, QUICK_CREATE_TITLE_FOCUS_DELAY_MS);
  const fieldsLocked = form.saving || form.creatorBlocked;

  if (!open && (checklistOpen || projectOpen)) {
    setChecklistOpen(false);
    setProjectOpen(false);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen && consumeQuickCreateChecklistDismiss(checklistOpen)) {
      setChecklistOpen(false);
      return;
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        mobileSheet={false}
        className={cn(
          QUICK_CREATE_TASK_DIALOG_CLASS,
          checklistOpen && QUICK_CREATE_TASK_DIALOG_STACKED_CLASS,
        )}
        forceNestedBackdrop={props.forceNestedBackdrop}
        initialFocus={titleInputRef}
      >
        <DialogTitle className="sr-only">{t('task.title')}</DialogTitle>
        <div className={QUICK_CREATE_TASK_STACK_CLASS}>
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col',
              checklistOpen && QUICK_CREATE_TASK_UNDER_LAYER_CLASS,
            )}
            inert={checklistOpen || undefined}
          >
            <form
              className={QUICK_CREATE_TASK_BODY_CLASS}
              autoComplete="off"
              onSubmit={(event) => event.preventDefault()}
            >
              {form.creatorBlocked ? (
                <p className="text-destructive mb-3 text-sm" role="alert">
                  {t('task.employeeNotLinked')}
                </p>
              ) : null}
              <QuickCreateTaskTitleRow
                title={form.title}
                isHighPriority={form.isHighPriority}
                disabled={fieldsLocked}
                saving={form.saving}
                titleInputRef={titleInputRef}
                onTitleChange={form.setTitle}
                onAdvance={() => descriptionInputRef.current?.focus()}
                onTogglePriority={() => form.setIsHighPriority((value) => !value)}
                onSubmit={() => void form.handleCreate()}
                onClose={() => onOpenChange(false)}
              />
              <QuickCreateTaskFields
                form={form}
                fieldsLocked={fieldsLocked}
                descriptionInputRef={descriptionInputRef}
              />
            </form>
            <QuickCreateTaskFooter
              actions={
                <QuickCreateTaskActionButtons
                  disabled={fieldsLocked}
                  filesCount={form.stagedFiles.length}
                  checklistCount={checklistDraftItemCount(form.checklists)}
                  projectOpen={projectOpen}
                  fileInputRef={fileInputRef}
                  onFilesPicked={form.addFiles}
                  onOpenChecklists={() => {
                    form.openChecklists();
                    setChecklistOpen(true);
                  }}
                  onProjectOpenChange={setProjectOpen}
                  linkedValues={
                    new Set(form.pickedLinks.map((link) => encodeQuickCreateDraftLinkValue(link)))
                  }
                  onSelectContext={form.selectContext}
                />
              }
              onOpenFull={onOpenFull}
              saving={form.saving}
              canCreate={form.canCreate}
              onCreate={() => void form.handleCreate()}
              onCancel={() => onOpenChange(false)}
            />
          </div>
          {checklistOpen ? (
            <button
              type="button"
              className={QUICK_CREATE_TASK_LAYER_SCRIM_CLASS}
              aria-label={tCommon('close')}
              onClick={() => setChecklistOpen(false)}
            />
          ) : null}
          {checklistOpen ? (
            <QuickCreateTaskChecklistOverlay
              checklists={form.checklists}
              disabled={fieldsLocked}
              onChange={form.setChecklists}
              onClose={() => setChecklistOpen(false)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickCreateTaskFields({
  form,
  fieldsLocked,
  descriptionInputRef,
}: {
  form: ReturnType<typeof useQuickCreateTaskForm>;
  fieldsLocked: boolean;
  descriptionInputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const t = useTranslations('forms');
  return (
    <>
      <div className="w-full min-w-0">
        <QuickCreateTaskAutoGrowTextarea
          id="quick-task-description"
          name="quick-create-task-description"
          value={form.description}
          onChange={(event) => form.setDescription(event.target.value)}
          placeholder={t('task.descriptionPlaceholder')}
          disabled={fieldsLocked}
          enterMode="description"
          inputRef={descriptionInputRef}
          className={QUICK_CREATE_TASK_DESCRIPTION_INPUT_CLASS}
          onSubmitShortcut={() => void form.handleCreate()}
        />
      </div>
      <div className="mt-3">
        <QuickCreateTaskMetaRow
          assigneeId={form.assigneeId}
          assigneeLabel={form.assigneeLabel}
          assigneeAvatar={form.assigneeAvatar}
          dueDate={form.dueDate}
          disabled={fieldsLocked}
          onSearchEmployees={form.searchEmployees}
          onSelectAssignee={form.selectAssignee}
          onDueDateChange={form.setDueDate}
        />
        <QuickCreateTaskSelectionChips
          files={form.stagedFiles}
          links={form.pickedLinks}
          disabled={fieldsLocked}
          onRemoveFile={form.removeFile}
          onUnlink={form.unlink}
        />
      </div>
    </>
  );
}
