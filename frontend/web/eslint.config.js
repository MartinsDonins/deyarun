const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        self: 'readonly',
        clients: 'readonly',
        firebase: 'readonly',
        importScripts: 'readonly'
      }
    },
    rules: {
      // SECURITY RULES - CRITICAL FOR PRODUCTION
      'no-console': ['error', { 
        allow: [] // No console methods allowed in production code
      }],
      
      // Security-focused rules
      'no-eval': 'error',
      'no-implied-eval': 'error', 
      'no-new-func': 'error',
      'no-script-url': 'error',
      
      // Prevent information disclosure
      'no-alert': 'error',
      'no-debugger': 'error',
      
      // Best practices for security
      'eqeqeq': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      
      // Type safety
      'no-undef': 'error',
      'no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }]
    }
  },
  {
    // Exception for development/build scripts - allow console
    files: ['scripts/**/*.js', '*.config.js', 'server.js'],
    rules: {
      'no-console': 'off'
    }
  },
  {
    // Exception for production logger - controlled console usage
    files: ['lib/productionLogger.ts', 'lib/logger.ts'],
    rules: {
      'no-console': ['error', { 
        allow: ['log', 'warn', 'error'] // Only in logger files
      }]
    }
  }
];