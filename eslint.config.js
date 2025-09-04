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
    // Ignore all dev scripts; production code lives in src/core, src/generators, src/templates
    'src/scripts/**'
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
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-debugger': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    // Keep a realistic file size limit for this project while being strict
    'max-lines': ['error', 220]
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
