module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'standard',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '.vercel/**',
    '*.min.js',
  ],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'semi': 'off',
    'no-trailing-spaces': 'off',
    'comma-dangle': 'off',
    'quotes': 'off',
    'quote-props': 'off',
    'space-before-function-paren': 'off',
    'padded-blocks': 'off',
    'multiline-ternary': 'off',
    'operator-linebreak': 'off',
    'prefer-const': 'off',
    'no-multi-spaces': 'off',
    'no-void': 'off',
    'no-useless-escape': 'off'
  },
}
