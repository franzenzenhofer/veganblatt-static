import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

const baseIgnores = {
  ignores: [
    'temp-scripts/**',
    // Ignore all dev scripts; production code lives in src/core, src/generators, src/templates
    'src/scripts/**'
  ]
};

const tsRules = [{
  files: ['src/**/*.ts'],
  languageOptions: {
    parser: tsparser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      project: './tsconfig.json'
    },
    globals: {
      console: 'readonly',
      process: 'readonly',
      Buffer: 'readonly',
      __dirname: 'readonly',
      __filename: 'readonly'
    }
  },
  plugins: {
    '@typescript-eslint': tseslint
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-debugger': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    // Keep a realistic file size limit for this project while being strict
    'max-lines': ['error', 220]
  }
}];

export default [baseIgnores, ...tsRules];
