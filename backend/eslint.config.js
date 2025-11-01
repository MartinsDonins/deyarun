export default [
  {
    ignores: [
      'node_modules/**',
      'tests/**',
      'scripts/**',
      '**/*.test.js',
      '**/*.spec.js'
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      }
    },
    rules: {
      // Error on console statements in production code
      'no-console': ['error', {
        allow: ['warn', 'error'] // Allow console.warn and console.error
      }],

      // Error on unused variables
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],

      // No var, use const/let
      'no-var': 'error',

      // Prefer const when variable is not reassigned
      'prefer-const': 'error',

      // Require === instead of ==
      'eqeqeq': ['error', 'always'],

      // Security: No eval
      'no-eval': 'error',

      // Security: No implied eval
      'no-implied-eval': 'error',
    }
  }
];
