import type { EditorProfile, ProfileId, ProfileIndex } from "./types";

/**
 * The whole editor is configured by one backend call.
 */

const API_BASE = "/api/profiles";

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} — ${url}`);
  }
  return (await response.json()) as T;
};

/*
 * The one declaration left in the codebase, and it has to stay one: TypeScript
 * only narrows through an `asserts` return type when the call target is a
 * function declaration or a const carrying an explicit type annotation. As a
 * plain arrow const this silently stops narrowing and `validate` below fails to
 * compile (TS2775) — the annotated-const form that does work would restate the
 * whole parameter list just to keep the arrow.
 */
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Malformed editor config: ${message}`);
}

/** Cheap structural checks so a typo in JSON fails loudly, not silently. */
const validate = (profile: EditorProfile, id: ProfileId): EditorProfile => {
  assert(
    profile && typeof profile === "object",
    `profile "${id}" is not an object`,
  );
  assert(profile.theme, `profile "${id}" is missing theme.json`);
  assert(
    profile.palette?.entries?.length,
    `profile "${id}" has an empty palette`,
  );
  assert(profile.workflow?.seed, `profile "${id}" is missing workflow.seed`);
  assert(profile.chrome?.tagline, `profile "${id}" is missing chrome.tagline`);
  return profile;
};

export const loadIndex = (): Promise<ProfileIndex> => {
  return getJson<ProfileIndex>(API_BASE);
};

export const loadProfile = async (id: ProfileId): Promise<EditorProfile> => {
  return validate(await getJson<EditorProfile>(`${API_BASE}/${id}`), id);
};

/** Single-file fetch, used by the Config Studio tabs to show raw source. */
export const loadProfilePart = (
  id: ProfileId,
  part: "profile" | "theme" | "palette" | "workflow",
): Promise<unknown> => {
  return getJson(`${API_BASE}/${id}/${part}`);
};
