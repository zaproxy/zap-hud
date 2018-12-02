# Welcome to the OWASP ZAP HUD
![](https://raw.githubusercontent.com/psiinon/zap-hud/master/assets/images/ZAP-HUD-Welcome-small.png)

The HUD is a completely new interface that brings information and functionality from ZAP into your browser.

For more details see:

* Blog: TBA
* Video: [The OWASP ZAP HUD - Usable Security Tooling](https://youtu.be/ztfgip-UhWw)
* The [wiki](../../wiki)

## Trying out the HUD
To try out the HUD you can either:

1. Download and run the latest [ZAP Weekly Release](https://github.com/zaproxy/zaproxy/wiki/Downloads#zap-weekly)
1. Run it from this repo using:
    ```
    git clone https://github.com/zaproxy/zap-hud.git
    ./gradlew runZap
    ```

Those of you building ZAP directly from the source code will also be able to install it from the [ZAP Marketplace](https://github.com/zaproxy/zap-extensions/wiki). 


You will need Java 8+ installed.

With both of these options you will first see the ZAP Desktop displayed. Select either `Firefox` or `Chrome` on the `Quick Start` tab and click on the `Launch Browser` button.

![](https://raw.githubusercontent.com/wiki/psiinon/zap-hud/assets/images/ZAP-launch-browser.png)

You can also configure Firefox or Chrome to proxy via ZAP manually, but you will need to import the ZAP Root CA Certificate.

We recommend that you follow the HUD tutorial even if you have read the above blog post and watched the video.

## Getting Involved

ZAP is a community project and so we are always very keen to hear from anyone who'd like to contribute, just post to the [ZAP Dev Group](https://groups.google.com/group/zaproxy-develop)

## Caveats

This is definitely alpha quality :)

Some known issues include:

* It's early days, so only a limited amount of ZAP functionality is available
* We're still using Vue.js in dev mode so can't apply a suitably strong CSP
* The JavaScript code needs to be properly formatted and linted
* Firefox has been tested more than Chrome, but both should work
* JxBrowser, despite being chromium based, doesn't currently work 
* The code to support the HUD in multiple browser tabs is _very_ new so might be buggy
* In particular don't close the first tab on Firefox or the HUD _will_ stop working 
* Documentation could, of course, be better
* Using the HUD with browser dev tools open can significantly affect performance
* Using the browser back button may cause problems
* Promises should be switched over to await pattern
* Error handling is poor
* This list is not complete
 
