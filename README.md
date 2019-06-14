# ![HUD Logo](https://raw.githubusercontent.com/zaproxy/zap-hud/develop/assets/images/hud_logo_128px.png) OWASP ZAP Heads Up Display 
![Release: Beta](https://img.shields.io/badge/release-beta-brightgreen.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/zaproxy/zap-hud/badge.svg?targetFile=package.json)](https://snyk.io/test/github/zaproxy/zap-hud?targetFile=package.json)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/zaproxy/zap-hud.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/zaproxy/zap-hud/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/zaproxy/zap-hud.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/zaproxy/zap-hud/context:javascript)

<img align="center" alt="Welcome to the HUD" src="assets/images/ZAP-HUD-Welcome-banner.png" width="100%">

The HUD is new interface that provides the functionality of ZAP **directly in the browser**.

Learn more:

* Blog: [Hacking with a Heads Up Display](https://segment.com/blog/hacking-with-a-heads-up-display/)
* Video: [The OWASP ZAP HUD - Usable Security Tooling](https://youtu.be/ztfgip-UhWw)
* Wiki: [Inside the HUD](../../wiki)

![](https://raw.githubusercontent.com/zaproxy/zap-hud/develop/assets/images/hud-break.gif)

## Using the HUD

### Downloading
You can try out ZAP enabled with the HUD via any of: 

* Download and run the latest [ZAP Release](https://github.com/zaproxy/zaproxy/wiki/Downloads#zap-280-standard)

or

* Run it from this repo using:
    ```
    git clone https://github.com/zaproxy/zap-hud.git
    cd zap-hud
    ./gradlew runZap
    ```

In all cases you will need Java 8+ installed.

You'll see the HUD Radar icon ![Radar Icon](https://raw.githubusercontent.com/zaproxy/zap-hud/develop/src/main/resources/org/zaproxy/zap/extension/hud/resources/radar.png) in the tool bar. When the icon is selected the HUD will be added to your browser.

![Toolbar with Radar](https://raw.githubusercontent.com/zaproxy/zap-hud/develop/assets/images/toolbar_radar.png)

### Starting the HUD
1. Quick Start: Select either `Firefox` or `Chrome` on the `Quick Start` tab and click on the `Launch Browser` button.

![](https://raw.githubusercontent.com/zaproxy/zap-hud/develop/assets/images/ZAP-Launch-browser.png)

2. Manually: You can also configure Firefox or Chrome to proxy via ZAP manually, but you will need to import the ZAP Root CA Certificate.

The first time the HUD is launched you'll be prompted with the HUD Tutorial. We recommend that you follow the tutorial even if you have read the above blog post and watched the video.

## Getting Involved

ZAP is a community project and so we are always very keen to hear from anyone who'd like to contribute, just post to the [ZAP HUD Group](https://groups.google.com/group/zaproxy-hud)

We'd also love to hear some feedback, which you can also give via that group.

## Limitations

This is still early days and there are some known issues and limitations with the current release. Development on the HUD is very active and we recommend you check in often for new features and improvements. :)

You should **NOT** use it on sites you do not trust!
However it **is** in scope for the ZAP bug bounty on [BugCrowd](https://bugcrowd.com/owaspzap)

Limitations while running:
* Only a limited amount of ZAP functionality is available
* Firefox has been tested more than Chrome, but both should work (JxBrowser, doesn't currently work)
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

 
