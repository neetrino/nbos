'use client';

import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { DepartmentItem, DepartmentMember } from '@/lib/api/employees';
import type { OrgChartLayoutNode } from './org-chart-layout';
import {
  ORG_CARD_FOOTER_CHILDREN_CLASS,
  ORG_CARD_FOOTER_IDLE_CLASS,
  ORG_CARD_SELECTED_CLASS,
  ORG_CARD_SHELL_CLASS,
  ORG_DEPT_TITLE_CLASS,
  ORG_DEPUTY_PREVIEW_MAX,
  ORG_HEAD_COUNT_CLASS,
  ORG_SUBORDINATE_PILL_CLASS,
  ORG_YOUR_DEPT_BADGE_CLASS,
} from './org-chart-constants';
import { orgChartCardPeople, orgChartSubordinateCount } from './org-chart-members';
import { OrgChartPersonRow } from './OrgChartPersonRow';

export function OrgDepartmentCard({
  department,
  node,
  heading,
  selected,
  childCount,
  expanded,
  isMine,
  onSelect,
  onToggleChildren,
  onOpenEmployee,
}: {
  department: DepartmentItem;
  node: OrgChartLayoutNode;
  heading: string;
  selected: boolean;
  childCount: number;
  expanded: boolean;
  isMine: boolean;
  onSelect: () => void;
  onToggleChildren: () => void;
  onOpenEmployee?: (employeeId: string) => void;
}) {
  const t = useTranslations('hr');
  const people = orgChartCardPeople(department.members ?? []);
  return (
    <article
      className={cn(ORG_CARD_SHELL_CLASS, selected && ORG_CARD_SELECTED_CLASS)}
      style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col gap-3 p-3.5 text-left"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex min-w-0 items-start gap-2">
          <p className={ORG_DEPT_TITLE_CLASS} title={heading}>
            {heading}
          </p>
          {isMine ? (
            <span className={ORG_YOUR_DEPT_BADGE_CLASS}>{t('orgChart.yourDepartment')}</span>
          ) : null}
        </div>
        <OrgDepartmentCardPeople
          department={department}
          cover={people.cover}
          listed={people.listed}
          listedKind={people.listedKind}
          onOpenEmployee={onOpenEmployee}
        />
      </div>
      <OrgDepartmentCardFooter
        childCount={childCount}
        expanded={expanded}
        onToggleChildren={onToggleChildren}
      />
    </article>
  );
}

function OrgDepartmentCardPeople({
  department,
  cover,
  listed,
  listedKind,
  onOpenEmployee,
}: {
  department: DepartmentItem;
  cover: DepartmentMember | undefined;
  listed: DepartmentMember[];
  listedKind: 'deputies' | 'members';
  onOpenEmployee?: (employeeId: string) => void;
}) {
  const t = useTranslations('hr');
  const memberCount = department._count?.members ?? department.members?.length ?? 0;
  const shown = (cover ? 1 : 0) + Math.min(listed.length, ORG_DEPUTY_PREVIEW_MAX);
  const subordinates = orgChartSubordinateCount(memberCount, shown);
  return (
    <>
      <div className="min-w-0">
        {cover ? (
          <OrgChartPersonRow
            member={cover}
            trailing={
              memberCount > 0 ? (
                <span className={ORG_HEAD_COUNT_CLASS}>
                  <Users className="size-3" aria-hidden />
                  {memberCount}
                </span>
              ) : null
            }
            onOpen={onOpenEmployee}
          />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </div>
      <div className="mt-auto grid min-w-0 grid-cols-2 gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px]">{t('orgChart.subordinates')}</p>
          <p className={ORG_SUBORDINATE_PILL_CLASS}>
            {t('orgChart.employeesCount', { count: subordinates })}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px]">
            {t(listedKind === 'deputies' ? 'orgChart.deputies' : 'orgChart.members')}
          </p>
          <OrgDepartmentDeputies deputies={listed} onOpenEmployee={onOpenEmployee} />
        </div>
      </div>
    </>
  );
}

function OrgDepartmentDeputies({
  deputies,
  onOpenEmployee,
}: {
  deputies: DepartmentMember[];
  onOpenEmployee?: (employeeId: string) => void;
}) {
  const visibleDeputies = deputies.slice(0, ORG_DEPUTY_PREVIEW_MAX);
  const extraDeputies = deputies.length - visibleDeputies.length;
  if (visibleDeputies.length === 0) return <p className="text-xs">—</p>;
  return (
    <div className="space-y-1">
      {visibleDeputies.map((member) => (
        <OrgChartPersonRow
          key={member.id}
          member={member}
          compact
          showTitle={false}
          onOpen={onOpenEmployee}
        />
      ))}
      {extraDeputies > 0 ? (
        <p className="text-muted-foreground text-[10px]">+{extraDeputies}</p>
      ) : null}
    </div>
  );
}

function OrgDepartmentCardFooter({
  childCount,
  expanded,
  onToggleChildren,
}: {
  childCount: number;
  expanded: boolean;
  onToggleChildren: () => void;
}) {
  const t = useTranslations('hr');
  if (childCount === 0) {
    return <p className={ORG_CARD_FOOTER_IDLE_CLASS}>{t('orgChart.noSubdepartments')}</p>;
  }
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      className={cn(ORG_CARD_FOOTER_CHILDREN_CLASS, 'flex items-center justify-center gap-1')}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onToggleChildren();
      }}
    >
      {t('orgChart.childCount', { count: childCount })}
      <Icon className="size-3" aria-hidden />
    </button>
  );
}
