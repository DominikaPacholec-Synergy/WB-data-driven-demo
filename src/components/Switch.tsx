import { Icon } from "@workflowbuilder/sdk";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: "extra-small" | "small" | "medium";
  disabled?: boolean;
  required?: boolean;
  error?: string;
  "aria-label"?: string;
};

export const Switch = ({
  checked,
  onChange,
  label,
  size = "medium",
  disabled = false,
  required = false,
  error,
  "aria-label": ariaLabel,
}: Props) => {
  return (
    <div className={`switch switch--${size}${disabled ? " is-disabled" : ""}`}>
      <label className="switch__row">
        <span className="switch__control">
          <input
            type="checkbox"
            role="switch"
            checked={checked}
            disabled={disabled}
            aria-label={label ? undefined : ariaLabel}
            onChange={(event) => onChange(event.currentTarget.checked)}
          />
          <span className="switch__track" />
          <span className="switch__thumb" />
        </span>
        {label ? (
          <span className="switch__label ax-public-p11">
            {required ? <Icon name="Asterisk" /> : null}
            {label}
          </span>
        ) : null}
      </label>
      {error ? <p className="switch__error">{error}</p> : null}
    </div>
  );
};
