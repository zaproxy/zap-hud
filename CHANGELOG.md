# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
 - Add API endpoints for getting and setting UI options. [#319](https://github.com/zaproxy/zap-hud/issues/319)
 - Add tasks for Enable, Show and Break tutorial pages
 - Add plain text/regex filtering capability to History section [#286](https://github.com/zaproxy/zap-hud/issues/233)

### Fixed
 - Correct handling of upgraded domains on startup. [#162](https://github.com/zaproxy/zap-hud/issues/162)
 - Stop the tutorial server when the add-on is uninstalled.

### Changed
 - Use websockets instead of HTTP for all ZAP API calls

## [0.2.0] - 2018-12-31

### Added
 - Add option to control on-domain messages. [#294](https://github.com/zaproxy/zap-hud/issues/294)
 - Add HTML report tool. [#312](https://github.com/zaproxy/zap-hud/issues/312)
 - Require cookie on all API calls

### Changed

 - Changed Attack Mode icon to crosshairs. [#221](https://github.com/zaproxy/zap-hud/issues/221)

### Fixed
 - Upgraded vue.js to 2.5.21 and vue-i18n to 8.5.0

## [0.1.2] - 2018-12-17

### Fixed
 - Fix bug where field alert flags don't show alert dialog. [#290](https://github.com/zaproxy/zap-hud/issues/290)

## [0.1.1] - 2018-12-06

## [0.1.0] - 2018-12-03
First alpha release.

[Unreleased]: https://github.com/zaproxy/zap-hud/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/zaproxy/zap-hud/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/zaproxy/zap-hud/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/zaproxy/zap-hud/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/zaproxy/zap-hud/compare/f41b7a279a3a2d86edbf22e7d48d6b9c24e768c8...v0.1.0
