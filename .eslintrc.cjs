module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: [
    '**/dist/**',
    '**/.next/**',
    'node_modules',
    '*.config.js',
    '*.config.cjs',
    '*.config.mjs'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off'
  }
};
