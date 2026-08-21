import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import pluginReact from 'eslint-plugin-react';
import pluginHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const reactRules = {
  'react/display-name': 'off',
  'react/prop-types': 'off',
  'react/function-component-definition': [
    'error',
    {
      namedComponents: 'arrow-function',
      unnamedComponents: 'arrow-function',
    },
  ],
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    ...pluginReact.configs.flat['jsx-runtime'],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    name: 'WB Data Driven Demo / src',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': pluginHooks,
    },
    rules: {
      ...pluginHooks.configs.recommended.rules,
      ...reactRules,
    },
  },
  {
    name: 'WB Data Driven Demo / node',
    files: ['vite.config.ts', 'vite-plugins/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
);
