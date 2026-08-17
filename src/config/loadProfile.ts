import type { EditorProfile, ProfileId, ProfileIndex } from './types';

/**
 * The whole editor is configured by one backend call.
 *
 * Today that backend is a Vite middleware reading JSON off disk
 * (`vite-plugins/config-api.ts`). Point `API_BASE` at a real service and
 * nothing else in the app changes — that is the entire thesis, in one module.
 */
const API_BASE = '/api/profiles';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} — ${url}`);
  }
  return (await response.json()) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Malformed editor config: ${message}`);
}

/** Cheap structural checks so a typo in JSON fails loudly, not silently. */
function validate(profile: EditorProfile, id: ProfileId): EditorProfile {
  assert(profile && typeof profile === 'object', `profile "${id}" is not an object`);
  assert(profile.theme, `profile "${id}" is missing theme.json`);
  assert(profile.palette?.entries?.length, `profile "${id}" has an empty palette`);
  assert(profile.workflow?.seed, `profile "${id}" is missing workflow.seed`);
  assert(profile.chrome?.productName, `profile "${id}" is missing chrome.productName`);
  return profile;
}

export function loadIndex(): Promise<ProfileIndex> {
  return getJson<ProfileIndex>(API_BASE);
}

export async function loadProfile(id: ProfileId): Promise<EditorProfile> {
  return validate(await getJson<EditorProfile>(`${API_BASE}/${id}`), id);
}

/** Single-file fetch, used by the Config Studio tabs to show raw source. */
export function loadProfilePart(
  id: ProfileId,
  part: 'profile' | 'theme' | 'palette' | 'workflow',
): Promise<unknown> {
  return getJson(`${API_BASE}/${id}/${part}`);
}
