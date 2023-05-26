# ![HUD Logo](https://raw.githubusercontent.com/zaproxy/zap-hud/main/assets/images/hud_logo_128px.png) OWASP ZAP Heads Up Display 
![Release: Beta](https://img.shields.io/badge/release-beta-brightgreen.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/zaproxy/zap-hud/badge.svg?targetFile=package.json)](https://snyk.io/test/github/zaproxy/zap-hud?targetFile=package.json)
[![CodeQL](https://github.com/zaproxy/zap-hud/actions/workflows/codeql.yml/badge.svg)](https://github.com/zaproxy/zap-hud/actions/workflows/codeql.yml)

# The HUD is no longer under active development

Unfortunately the HUD is no longer under active development due to the fact no one is focusing on it.

The HUD is a unique and innovative interface that we know some people love.
But it also needs a non trivial amount of maintenance and we just don’t have enough volunteers to maintain it right now.

If you would like to get involved please get in touch via the [ZAP HUD Group](https://groups.google.com/group/zaproxy-hud).

In order to keep maintaining the HUD we do not actually need anyone with Java experience - we have that covered.
We need someone with good Java Script experience and the confidence to dive into non trivial browser issues.

The HUD is a very unconventional project, and does unusual things in order to get around browser security features.
Browser changes often break the HUD in strange ways.

We know that the HUD no longer loads reliably all of the time in Firefox and Chrome, and the integration tests we have for it have been broken for some time.

If you are up for a challenge then [let us know](https://groups.google.com/group/zaproxy-hud)!

<img align="center" alt="Welcome to the HUD" src="assets/images/ZAP-HUD-Welcome-banner.png" width="100%">

The HUD is an interface that provides the functionality of ZAP **directly in the browser**.

Learn more:

* Blog: [Hacking with a Heads Up Display](https://segment.com/blog/hacking-with-a-heads-up-display/)
* Video: [The OWASP ZAP HUD - Usable Security Tooling](https://youtu.be/ztfgip-UhWw)
* Wiki: [Inside the HUD](../../wiki)

![](https://raw.githubusercontent.com/zaproxy/zap-hud/main/assets/images/hud-break.gif)

## Using the HUD

### Downloading
You can try out ZAP enabled with the HUD via any of: 

* Download and run the latest [ZAP Release](https://www.zaproxy.org/download/)

or

* Run it from this repo using:
    ```
    git clone https://github.com/zaproxy/zap-hud.git
    cd zap-hud
    ./gradlew runZap
    ```

In all cases you will need Java 11+ installed.

You'll see the HUD Radar icon ![Radar Icon](https://raw.githubusercontent.com/zaproxy/zap-hud/main/src/main/resources/org/zaproxy/zap/extension/hud/resources/radar.png) in the toolbar. When the icon is selected the HUD will be added to your browser.

![Toolbar with Radar](https://raw.githubusercontent.com/zaproxy/zap-hud/main/assets/images/toolbar_radar.png)

### Starting the HUD
1. Quick Start: Select either `Firefox` or `Chrome` on the `Quick Start` tab and click on the `Launch Browser` button.

![](https://raw.githubusercontent.com/zaproxy/zap-hud/main/assets/images/ZAP-Launch-browser.png)

2. Manually: You can also configure Firefox or Chrome to proxy via ZAP manually, but you will need to import the ZAP Root CA Certificate (and may require other setting changes in up-to-date browsers).

The first time the HUD is launched you'll be prompted with the HUD Tutorial. We recommend that you follow the tutorial even if you have read the above blog post and watched the video.

## Getting Involved

ZAP is a community project and so we are always very keen to hear from anyone who'd like to contribute, just post to the [ZAP HUD Group](https://groups.google.com/group/zaproxy-hud)

We'd also love to hear some feedback, which you can also give via that group.

## Limitations

This is still early days and there are some known issues and limitations with the current release. Development on the HUD is active and we recommend you check in often for new features and improvements. :)

You should **NOT** use it on sites you do not trust!
However it **is** in scope for the ZAP bug bounty on [BugCrowd](https://bugcrowd.com/owaspzap)

Limitations while running:
* Only a limited amount of ZAP functionality is available
* Firefox has been tested more than Chrome, but both should work
* The code to support the HUD in multiple browser tabs is _very_ new so might be buggy
    * In particular don't close the first tab on Firefox or the HUD _will_ stop working (weird, we know. See [#199](https://github.com/zaproxy/zap-hud/issues/199) for details)
* Using the HUD with browser dev tools open can significantly affect performance
* Behaviour using the browser back button is currently undefined

Issues and todos in code:
* We're using Vue.js in dev mode, which prevents us from using a suitably strong CSP
* JavaScript code still needs to be formatted and linted
* Documentation could, of course, be better
* Async functions are handled as via Promises as opposed to using 'await' pattern

These lists aren't exhaustive, but do highlight some of the larger restrictions.
