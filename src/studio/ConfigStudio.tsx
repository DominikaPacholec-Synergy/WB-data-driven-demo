import { useState } from 'react';
import { Icon } from '@workflowbuilder/sdk';

import type { EditorProfile, PaletteConfig } from '../config/types';
import { DiagramPanel } from './DiagramPanel';
import { SchemaPanel } from './SchemaPanel';
import { TokenPanel } from './TokenPanel';

/**
 * The Config Studio: a dock that edits the very data the editor was built from.
 *
 * It exists to make the thesis touchable. Everything it changes is a value that
 * arrived over HTTP from `/api/profiles/:id`, and everything it produces is a
 * file a backend could serve back.
 */

type Tab = 'tokens' | 'schema' | 'diagram';

const TABS: { id: Tab; label: string }[] = [
  { id: 'tokens', label: 'Tokens' },
  { id: 'schema', label: 'Schema' },
  { id: 'diagram', label: 'Diagram' },
];

type Props = {
  profile: EditorProfile;
  onApplyPalette: (palette: PaletteConfig) => void;
  onClose: () => void;
};

export function ConfigStudio({ profile, onApplyPalette, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('tokens');

  return (
    <aside className="studio">
      <header className="studio__head">
        <div className="studio__tabs" role="tablist">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              className={tab === entry.id ? 'is-active' : undefined}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <button type="button" className="studio__close" onClick={onClose} title="Close Config Studio">
          <Icon name="X" size="medium" />
        </button>
      </header>

      {tab === 'tokens' ? <TokenPanel theme={profile.theme} /> : null}
      {tab === 'schema' ? (
        <SchemaPanel profile={profile} onApplyPalette={onApplyPalette} />
      ) : null}
      {tab === 'diagram' ? <DiagramPanel /> : null}
    </aside>
  );
}
