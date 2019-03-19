# ![HUD Logo](https://raw.githubusercontent.com/zaproxy/zap-hud/develop/assets/images/hud_logo_128px.png) OWASP ZAP Heads Up Display 
![Release: Alpha](https://img.shields.io/badge/release-alpha-brightgreen.svg)
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

### Usage

#### From Source Code
You can download ZAP enabled with the HUD from any of: 

1. Download and run the latest [ZAP Weekly Release](https://github.com/zaproxy/zaproxy/wiki/Downloads#zap-weekly)
2. Run it from this repo using:
    ```
    git clone https://github.com/zaproxy/zap-hud.git
    cd zap-hud
    ./gradlew runZap
    ```
3. Those of you building ZAP directly from the source code will also be able to install it from the [ZAP Marketplace](https://github.com/zaproxy/zap-extensions/wiki). 

In all cases you will need Java 8+ installed.

You'll see the HUD Radar icon ![Radar Icon](https://raw.githubusercontent.com/zaproxy/zap-hud/develop/src/main/resources/org/zaproxy/zap/extension/hud/resources/radar.png) in the tool bar. When the icon is selected the HUD will be added to your browser.

![Toolbar with Radar](https://raw.githubusercontent.com/zaproxy/zap-hud/develop/assets/images/toolbar_radar.png)

#### Docker Compose
Alternatively if you just want to run ZAP with zero setup and the HUD automatically installed and enabled with Docker you can use the included `docker/docker-compose.yml` to start the environment in a Docker container.

```
    git clone https://github.com/zaproxy/zap-hud.git
    cd zap-hud/docker
    cp .env.example .env
```

Create a random API key of your choosing and add it to your `.env` file
```
ZAP_API_KEY=somevalue
```
Start `docker-compose` environment

```
    docker-compose up -d
```

#### Docker Stand-Alone
If you'd like to run ZAP in a Docker container without cloning the repo and a `docker-compose` environment, you can run the following `docker` command, swapping out `CHANGE_ME` with your custom API Key value:

```
docker run -u zap -p 9090:9090 --rm -i owasp/zap2docker-weekly zap.sh -daemon -host 0.0.0.0 -port 9090 \
-config api.addrs.addr.name=.* -config api.addrs.addr.regex=true -config -config api.key=CHANGE_ME \
-config hud.enabledForDaemon=true
```

### Docker Usage Considerations
For more detailed instructions on configuring your browser to use CA certificates generated in a ephemeral Docker environment please see the official wiki entry:

[Using the HUD with ZAP in Docker](https://github.com/zaproxy/zap-hud/wiki/Using-the-HUD-with-ZAP-in-Docker)

### Starting the HUD
1. Quick Start: Select either `Firefox` or `Chrome` on the `Quick Start` tab and click on the `Launch Browser` button.

![](https://raw.githubusercontent.com/zaproxy/zap-hud/develop/assets/images/ZAP-Launch-browser.png)

2. Manually: You can also configure Firefox or Chrome to proxy via ZAP manually, but you will need to import the ZAP Root CA Certificate.

The first time the HUD is launched you'll be prompted with the HUD Tutorial. We recommend that you follow the tutorial even if you have read the above blog post and watched the video.

## Getting Involved

ZAP is a community project and so we are always very keen to hear from anyone who'd like to contribute, just post to the [ZAP HUD Group](https://groups.google.com/group/zaproxy-hud)

We'd also love to hear some feedback, which you can also give via that group.

## Alpha Limitations

This is definitely still Alpha quality and there are some known issues and limitations with the current release. Development on the HUD is very active and we recommend you check in often for new features and improvements. :)

You should **NOT** use it on sites you do not trust!
However it **is** in scope for the ZAP bug bounty on [BugCrowd](https://bugcrowd.com/owaspzap)

Limitations while running:
* It's early days, so only a limited amount of ZAP functionality is available
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

 
