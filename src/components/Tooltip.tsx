import type { ReactNode } from "react";

type Props = {
  label: string;
  description?: string;
  align?: "start" | "center" | "end";
  children: ReactNode;
};

export const Tooltip = ({
  label,
  description,
  align = "center",
  children,
}: Props) => {
  return (
    <div className={`tooltip tooltip--${align}`}>
      {children}
      <span className="tooltip__pop tooltip__arrow" aria-hidden="true" />
      <span
        className="tooltip__pop tooltip__bubble ax-public-p11"
        aria-hidden="true"
      >
        <span className="tooltip__name">{label}</span>
        {description ? (
          <span className="tooltip__detail">{description}</span>
        ) : null}
      </span>
    </div>
  );
};
