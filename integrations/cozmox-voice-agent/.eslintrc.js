module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    es2020: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    // Minimal rules for now
    'no-console': 'warn'
  }
}