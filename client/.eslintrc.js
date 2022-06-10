module.exports = {
	root: true,
	env: {
		node: true
	},
	ignorePatterns: ["**/node_modules/**", "**/cypress/**", "**/plotly.min.js", "**/plotly*.js"],
	"extends": [
		'plugin:vue/essential',
		'plugin:vue/recommended',
		'eslint:recommended',
		'@vue/typescript/recommended'
	],
	"parserOptions": {
		ecmaVersion: 2020
	},
	"rules": {
		'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		"vue/html-indent": "off",
		"vue/no-v-html": "off",
		"vue/html-self-closing": "off",
		"vue/html-closing-bracket-newline": "off",
		"vue/multiline-html-element-content-newline": "off",
		"vue/singleline-html-element-content-newline": "off",
		"vue/max-attributes-per-line": "off",
		"@typescript-eslint/camelcase": "off",
		"@typescript-eslint/ban-ts-ignore": "off",
		"@typescript-eslint/no-use-before-define": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/class-name-casing": "off",
		"vue/require-default-prop": "off",
		"vue/no-mutating-props": "off",
	}
}
