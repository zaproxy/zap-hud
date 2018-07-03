**Dependences**


**Installing**


**Building**
The HUD uses `webpack` as its *static module bundler* to transpile Vue & javascript files.

Run webpack with:
`npm run build`

The HUD uses `ant` as its Java build tool.

Run ant with from the `build` directory with:
`ant deploy-hud`

**Testing**
The HUD uses `ava` as its testing framework.

Run all tests with:
`npm run test`

Tests are found in the `test` directory.

**Linting**
The HUD uses `xo` as its linter.

Run the linter with:
`npm run lint`
