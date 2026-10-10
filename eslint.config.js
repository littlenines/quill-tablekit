import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const CONTROL_STATEMENTS = ['if', 'for', 'while', 'do', 'switch', 'try']

export default defineConfig([
  globalIgnores(['dist', 'demo']),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    plugins: { '@stylistic': stylistic },
    languageOptions: { globals: globals.browser },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['const', 'let'] },
        { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
        { blankLine: 'always', prev: '*', next: CONTROL_STATEMENTS },
        { blankLine: 'always', prev: CONTROL_STATEMENTS, next: '*' },
        { blankLine: 'any', prev: 'if', next: ['if', 'return'] },
        { blankLine: 'always', prev: 'block-like', next: '*' },
      ],
      '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-restricted-syntax': [
        'error',
        { selector: 'VariableDeclarator > FunctionExpression', message: 'Use an arrow function instead.' },
      ],
    },
  },
])
