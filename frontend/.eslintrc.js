module.exports = {
    root: true,
    extends: 'react-app',
    ignorePatterns: ['../external/**/*', '**/node_modules/**/*'],
    parser: '@typescript-eslint/parser',
    parserOptions: { project: ['./tsconfig.json'] },
    plugins: ['@typescript-eslint'],
    rules: {
        'jsx-a11y/accessible-emoji': 'off',
    },
}
