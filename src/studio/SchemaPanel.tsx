import { useEffect, useState } from "react";

import { compileProfile } from "../config/compileProfile";
import { loadProfilePart } from "../config/loadProfile";
import type { EditorProfile, PaletteConfig } from "../config/types";

const PARTS = ["palette", "workflow", "theme", "profile"] as const;
type Part = (typeof PARTS)[number];

type Props = {
  profile: EditorProfile;
  onApplyPalette: (palette: PaletteConfig) => void;
};

export const SchemaPanel = ({ profile, onApplyPalette }: Props) => {
  const [part, setPart] = useState<Part>("palette");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus(null);
    setFailed(false);
    setText("");
    void loadProfilePart(profile.id, part)
      .then((data) => {
        if (!cancelled) setText(JSON.stringify(data, null, 2));
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setFailed(true);
        setStatus(cause instanceof Error ? cause.message : String(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [profile.id, part]);

  const apply = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (cause) {
      setFailed(true);
      setStatus(cause instanceof Error ? cause.message : "Invalid JSON");
      return;
    }

    const palette = parsed as PaletteConfig;
    if (!Array.isArray(palette?.entries) || palette.entries.length === 0) {
      setFailed(true);
      setStatus('A palette needs a non-empty "entries" array.');
      return;
    }

    /*???
     * Dry-run the compiler before handing the palette upstream. `compileProfile`
     * runs inside a `useMemo` in App, so a ProfileError raised there would take
     * the whole app down mid-render. Catching it here keeps a typo — a duplicate
     * node type, a seed pointing at a type you just renamed — as an inline
     * message next to the textarea where it was made.
     */
    try {
      compileProfile({ ...profile, palette });
    } catch (cause) {
      setFailed(true);
      setStatus(cause instanceof Error ? cause.message : String(cause));
      return;
    }

    onApplyPalette(palette);
    setFailed(false);
    setStatus(
      "Applied. The diagram was kept and re-validated against the new schema.",
    );
  };

  return (
    <div className="studio__panel">
      <p className="studio__lede">
        Straight from{" "}
        <code>
          GET /api/profiles/{profile.id}/{part}
        </code>
        . Editing the palette rewrites the node types and their property schemas
        at runtime.
      </p>

      <div className="studio__subtabs">
        {PARTS.map((entry) => (
          <button
            key={entry}
            type="button"
            className={part === entry ? "is-active" : undefined}
            onClick={() => setPart(entry)}
          >
            {entry}.json
          </button>
        ))}
      </div>

      <textarea
        className="studio__editor"
        spellCheck={false}
        value={text}
        readOnly={part !== "palette"}
        onChange={(event) => setText(event.currentTarget.value)}
      />

      {status ? (
        <p className={failed ? "studio__status is-error" : "studio__status"}>
          {status}
        </p>
      ) : null}

      <footer className="studio__footer">
        <button type="button" disabled={part !== "palette"} onClick={apply}>
          Apply
        </button>
      </footer>
      <p className="studio__hint">
        {part === "palette"
          ? 'Try: on approval.human set thresholdAmount’s "minimum" to 5000 — above the 1000 the node already carries — then Apply and select Human Approval.'
          : "Read-only here — this tab shows what the backend serves."}
      </p>
    </div>
  );
};
