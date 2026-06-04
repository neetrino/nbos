'use client';

import type { MouseEvent, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  actionTileIconVariants,
  actionTileShellVariants,
  type ActionTileSize,
  type ActionTileTone,
} from './action-tile-button-classes';

export interface ActionTileButtonProps {
  label: string;
  icon: ReactNode;
  tone?: ActionTileTone;
  size?: ActionTileSize;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  /** Stretch in flex/grid layouts (panels, dashboard tiles). */
  fullWidth?: boolean;
  /** Same look, no navigation or click (e.g. drag preview). */
  displayOnly?: boolean;
  /** Shown after the label (e.g. external-link hint). */
  trailing?: ReactNode;
  openInNewTab?: boolean;
  /** Native button type when rendering as `<button>` (default `button`). */
  buttonType?: 'button' | 'submit' | 'reset';
}

function ActionTileContent({
  label,
  icon,
  tone,
  size,
  trailing,
}: Pick<ActionTileButtonProps, 'label' | 'icon' | 'tone' | 'size' | 'trailing'>) {
  return (
    <>
      <span className={actionTileIconVariants({ tone, size })}>{icon}</span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate">{label}</span>
        {trailing}
      </span>
    </>
  );
}

export function ActionTileButton({
  label,
  icon,
  tone = 'primary',
  size = 'md',
  href,
  external = false,
  onClick,
  disabled = false,
  title,
  className,
  fullWidth = false,
  displayOnly = false,
  trailing,
  openInNewTab = true,
  buttonType = 'button',
}: ActionTileButtonProps) {
  const shellClass = cn(
    actionTileShellVariants({ tone, size }),
    fullWidth && 'w-full flex-1',
    className,
  );

  if (displayOnly) {
    return (
      <div className={cn(shellClass, 'cursor-default select-none')} aria-hidden={false}>
        <ActionTileContent label={label} icon={icon} tone={tone} size={size} trailing={trailing} />
      </div>
    );
  }

  if (href && !disabled) {
    if (external) {
      return (
        <a
          href={href}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noreferrer' : undefined}
          className={shellClass}
          title={title}
        >
          <ActionTileContent
            label={label}
            icon={icon}
            tone={tone}
            size={size}
            trailing={trailing}
          />
        </a>
      );
    }
    return (
      <Link
        href={href}
        className={shellClass}
        title={title}
        onClick={(event) => event.stopPropagation()}
      >
        <ActionTileContent label={label} icon={icon} tone={tone} size={size} trailing={trailing} />
      </Link>
    );
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <button
      type={buttonType}
      disabled={disabled}
      title={disabled ? title : title}
      onClick={handleClick}
      className={shellClass}
    >
      <ActionTileContent label={label} icon={icon} tone={tone} size={size} trailing={trailing} />
    </button>
  );
}
