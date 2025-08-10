module.exports = {
  // ...existing code...
  rules: {
    // ...existing rules...
    '@typescript-eslint/no-unused-vars': 'off',
    // Or conditionally disable:
    // '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-require-imports': ['error', {
      'allow': ['/package\\.json$/', '/\\.config\\.js$/']
    }]
  }
  // ...existing code...
};