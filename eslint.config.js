import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      // Components are documented with JSDoc rather than runtime propTypes,
      // which is the typing convention for this project.
      'react/prop-types': 'off',
      // No sentence may be written between JSX tags. Everything the reader sees
      // comes from src/i18n, which is what makes it possible to promise that
      // switching to Arabic leaves no French behind. The exceptions are
      // typographic marks and units, which belong to no language.
      //
      // Props are deliberately left to scripts/check-i18n.mjs. This rule cannot
      // tell a label from a className, so switching it on for props buries the
      // real findings under four hundred CSS class names.
      'react/jsx-no-literals': [
        'error',
        {
          noStrings: true,
          ignoreProps: true,
          allowedStrings: ['—', '·', ' · ', 'F', '?', '/', ' / ', ' → ', ':', ' : '],
        },
      ],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
