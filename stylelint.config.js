/** @type {import('stylelint').Config} */
export default {
  customSyntax: 'postcss-scss',
  plugins: ['stylelint-order'],
  rules: {
    'order/order': [
      [
        { type: 'at-rule', name: 'include', hasBlock: false },
        'dollar-variables',
        'declarations',
      ],
    ],
    'declaration-empty-line-before': [
      'always',
      {
        except: ['after-declaration', 'first-nested'],
        ignore: ['after-comment', 'inside-single-line-block'],
      },
    ],
  },
}
