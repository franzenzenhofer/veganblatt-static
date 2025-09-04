let tseslint = null;
let tsparser = null;
try {
  // Dynamically import to avoid hard failure when dev deps are missing
  // eslint-disable-next-line no-eval
  tseslint = (await import('@typescript-eslint/eslint-plugin')).default;
  // eslint-disable-next-line no-eval
  tsparser = (await import('@typescript-eslint/parser')).default;
} catch (e) {
  // Fallback will be applied below
}

const baseIgnores = {
  ignores: [
    'temp-scripts/**',
    'src/scripts/tests/**',
    'src/scripts/generate-ai-images.ts',
    'src/scripts/generate-vegan-images.ts',
    'src/scripts/generate-and-crop.ts',
    'src/scripts/direct-api-test.ts',
    'src/scripts/fix-duplicate-titles.ts',
    'src/scripts/image-copyright-audit.ts',
    'src/scripts/remove-manual-copyright.ts'
  ]
};

const tsRules = tsparser && tseslint ? [{
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
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-debugger': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'max-lines': ['warn', 60]
  }
}] : [{
  // Fallback minimal ruleset when TS plugin not available
  files: ['src/**/*.ts'],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    globals: {
      console: 'readonly',
      process: 'readonly',
      Buffer: 'readonly'
    }
  },
  rules: {
    'no-debugger': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'max-lines': ['warn', 60]
  }
}];

export default [baseIgnores, ...tsRules];
