import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'public/api', '.worktrees'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        document: 'readonly',
        window: 'readonly',
        MediaQueryListEvent: 'readonly',
        ResizeObserver: 'readonly',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
