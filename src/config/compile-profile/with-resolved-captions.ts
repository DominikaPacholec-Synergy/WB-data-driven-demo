import type { FieldSchemaConfig } from '../types/palette';

/**
 * The caption pass: the one place where a field's wording travels from the schema
 * property, where the config author writes it, to the uischema element, where the
 * SDK reads it.
 */

const LABELLED_CONTROLS = new Set([
  'Text',
  'TextArea',
  'Select',
  'Switch',
  'DatePicker',
  'VariableText',
  'VariableTextArea',
]);

const SCOPE_PREFIX = '#/properties/';

type UiElement = {
  type?: unknown;
  scope?: unknown;
  label?: unknown;
  placeholder?: unknown;
  elements?: unknown[];
};

export const withResolvedCaptions = (
  element: unknown,
  properties: Record<string, FieldSchemaConfig>,
): unknown => {
  if (element === null || typeof element !== 'object') return element;
  const el = element as UiElement;

  const walked = Array.isArray(el.elements)
    ? { ...el, elements: el.elements.map((child) => withResolvedCaptions(child, properties)) }
    : el;

  if (typeof el.type !== 'string' || !LABELLED_CONTROLS.has(el.type)) return walked;
  if (typeof el.scope !== 'string' || !el.scope.startsWith(SCOPE_PREFIX)) return walked;

  const field = properties[el.scope.slice(SCOPE_PREFIX.length)];
  const inherit = (key: 'label' | 'placeholder') =>
    el[key] === undefined && typeof field?.[key] === 'string' ? { [key]: field[key] } : {};

  return { ...walked, ...inherit('label'), ...inherit('placeholder') };
};
