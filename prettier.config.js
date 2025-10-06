/** @type {import('prettier').Options} */
module.exports = {
  printWidth: 120,
  singleQuote: true,
  semi: false,
  tailwindFunctions: ['clsx'],
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
}
