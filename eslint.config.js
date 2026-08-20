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
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: 'detect' } },
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
      'react/prop-types': 'off', // Disable prop-types (using TypeScript-style props)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      /*
       * The React Compiler rules that arrived with eslint-plugin-react-hooks v7
       * are on as errors. They found real things here: a ref written during
       * render in useStore, a notification list read before its loader was
       * declared, and six effects that copied derived or persisted values into
       * state one render too late. Fix the file rather than adding a disable
       * comment.
       */
    },
  },
]
