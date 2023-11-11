module.exports = {
    env: {
        browser: true,
        node: true,
        es2022: true,
    },
    parser: '@babel/eslint-parser',
    parserOptions: {
        requireConfigFile: false,
        sourceType: 'module',
    },
    extends: [
        'eslint:recommended',
        'plugin:import/recommended',
    ],
    rules: {
        'space-before-function-paren': [
            'error',
            {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always',
            },
        ],
        'object-curly-spacing': [
            'error',
            'always',
        ],
        'no-console': 'off',
        'no-var': 'error',
        'prefer-const': 'error',
        indent: [
            'error',
            4,
            {
                SwitchCase: 1,
            },
        ],
        semi: [
            'error',
            'always',
        ],
        quotes: [
            'error',
            'single',
        ],
        'quote-props': [
            'error',
            'as-needed',
        ],
        'object-curly-newline': [
            'error',
            {
                multiline: true,
                consistent: true,
            },
        ],
        'comma-dangle': [
            'error',
            'always-multiline',
        ],
        'comma-spacing': [
            'error',
            {
                before: false,
                after: true,
            },
        ],
        'comma-style': [
            'error',
            'last',
        ],
        'eol-last': 'error',
        'key-spacing': [
            'error',
            {
                beforeColon: false,
                afterColon: true,
            },
        ],
        'keyword-spacing': [
            'error',
            {
                before: true,
                after: true,
            },
        ],
        'block-spacing': 'error',
        'space-in-parens': [
            'error',
            'never',
        ],
        'space-before-blocks': 'error',
        'no-trailing-spaces': 'error',
        'semi-spacing': [
            'error',
            {
                before: false,
                after: true,
            },
        ],
        'space-infix-ops': 'error',

        // Ignore unresolved tmp file from build process
        'import/no-unresolved': [
            'error',
            {
                ignore: [
                    'tmp/commands\\.json$',
                ],
            },
        ],
    },
};
