import { useEffect, useId, useRef, useState } from "react";
import { Icon, type WBIcon } from "@workflowbuilder/sdk";

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
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  "aria-label"?: string;
};

export const Dropdown = <T extends string = string>({
  value,
  options,
  onChange,
  placeholder = "Select…",
  size = "medium",
  disabled = false,
  "aria-label": ariaLabel,
}: Props<T>) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  /** Highlighted row while the list is open; -1 until something is chosen. */
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  const selected = selectedIndex === -1 ? undefined : options[selectedIndex];
  const optionId = (index: number) => `${listId}-option-${index}`;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
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
      case "ArrowDown":
        event.preventDefault();
        if (!open) openAt(from === -1 ? 0 : from);
        else setActiveIndex(from >= last ? last : from + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openAt(from === -1 ? last : from);
        else setActiveIndex(from <= 0 ? 0 : from - 1);
        break;
      case "Home":
        if (!open) break;
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        if (!open) break;
        event.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) openAt(from === -1 ? 0 : from);
        else if (from !== -1) commit(from);
        break;
      case "Escape":
        if (!open) break;
        event.preventDefault();
        close();
        break;
      case "Tab":
        // Leave the popup behind rather than trapping the tab order in it.
        if (open) close(false);
        break;
    }
  };

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`dropdown__button dropdown__button--${size}`}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={
          open && activeIndex !== -1 ? optionId(activeIndex) : undefined
        }
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close(false) : openAt(selectedIndex))}
        onKeyDown={onKeyDown}
      >
        <span className="dropdown__value">
          {selected?.icon ? <Icon name={selected.icon} size="small" /> : null}
          <span className={selected ? undefined : "dropdown__placeholder"}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <Icon name="CaretDown" size="small" />
      </button>

      <ul
        className={`dropdown__popup dropdown__popup--${size}`}
        id={listId}
        role="listbox"
        hidden={!open}
      >
        {options.map((option, index) => (
          <li
            key={option.value}
            id={optionId(index)}
            role="option"
            aria-selected={option.value === value}
            className={`dropdown__option${index === activeIndex ? " is-active" : ""}`}
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
      </ul>
    </div>
  );
};
