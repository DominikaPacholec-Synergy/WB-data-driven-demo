import { Icon, type WBIcon } from '@workflowbuilder/sdk';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './dropdown.module.css';

import { type Anchor, anchorTo } from './anchor-to';

export type DropdownOption<T extends string = string> = {
  value: T;
  label: string;
  icon?: WBIcon;
};

type Props<T extends string = string> = {
  value: T | null;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  'aria-label'?: string;
};

export const Dropdown = <T extends string = string>({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  size = 'medium',
  disabled = false,
  'aria-label': ariaLabel,
}: Props<T>) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const open = anchor !== null;
  const selectedIndex = options.findIndex((option) => option.value === value);
  /** Highlighted row while the list is open; -1 until something is chosen. */
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  const selected = selectedIndex === -1 ? undefined : options[selectedIndex];
  const optionId = (index: number) => `${listId}-option-${index}`;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setAnchor(null);
    };

    /** The popup is anchored in viewport coordinates, so it has to follow the trigger. */
    const reanchor = () => {
      if (buttonRef.current) setAnchor(anchorTo(buttonRef.current));
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', reanchor, true);
    window.addEventListener('resize', reanchor);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', reanchor, true);
      window.removeEventListener('resize', reanchor);
    };
  }, [open]);

  const close = (refocus = true) => {
    setAnchor(null);
    if (refocus) buttonRef.current?.focus();
  };

  const openAt = (index: number) => {
    setActiveIndex(index);
    if (buttonRef.current) setAnchor(anchorTo(buttonRef.current));
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!options.length) return;
    const last = options.length - 1;
    const from = activeIndex === -1 ? selectedIndex : activeIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openAt(from === -1 ? 0 : from);
        else setActiveIndex(from >= last ? last : from + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openAt(from === -1 ? last : from);
        else setActiveIndex(from <= 0 ? 0 : from - 1);
        break;
      case 'Home':
        if (!open) break;
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        if (!open) break;
        event.preventDefault();
        setActiveIndex(last);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) openAt(from === -1 ? 0 : from);
        else if (from !== -1) commit(from);
        break;
      case 'Escape':
        if (!open) break;
        event.preventDefault();
        close();
        break;
      case 'Tab':
        // Leave the popup behind rather than trapping the tab order in it.
        if (open) close(false);
        break;
    }
  };

  return (
    <div className={styles['dropdown']} data-dropdown ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={clsx(styles['button'], styles[`button--${size}`])}
        data-dropdown-trigger
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={open && activeIndex !== -1 ? optionId(activeIndex) : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close(false) : openAt(selectedIndex))}
        onKeyDown={onKeyDown}
      >
        <span className={styles['value']}>
          {selected?.icon ? <Icon name={selected.icon} size="small" /> : null}
          <span className={selected ? undefined : styles['placeholder']}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <Icon name="CaretDown" size="small" />
      </button>

      {anchor
        ? createPortal(
            <ul
              ref={popupRef}
              className={clsx(styles['popup'], styles[`popup--${size}`], {
                [styles['popup--above']]: anchor.bottom !== undefined,
              })}
              style={{
                left: anchor.left,
                top: anchor.top,
                bottom: anchor.bottom,
                width: anchor.width,
                maxHeight: anchor.maxHeight,
              }}
              id={listId}
              role="listbox"
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={option.value === value}
                  className={clsx(styles['option'], {
                    [styles['is-active']]: index === activeIndex,
                  })}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    commit(index);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {option.icon ? <Icon name={option.icon} size="small" /> : null}
                  {option.label}
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
};
