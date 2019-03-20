/*
 * Management Frame
 *
 * Initializes the service worker and forwards messages between the service worker
 * and inject.js.
 */

// temp time test
// var startTime = new Date().getTime();
//TODO: Refactor tabId as props
let tabId = "";

// // Injected strings
const SHOW_WELCOME_SCREEN = "<<SHOW_WELCOME_SCREEN>>" === "true" ? true : false;
const ZAP_SHARED_SECRET = process.env.ZAP_SHARED_SECRET;

import Vue from "vue";
import localforage from "localforage";
import Management from "./Management.vue";

document.addEventListener("DOMContentLoaded", () => {
  new Vue({
    el: "#app",
    template: "<Management/>",
    components: { Management }
  });

  let params = new URL(document.location).searchParams;

  tabId = params.get("tabId");

  app = new Vue({
    el: "#app",
    data: {
      showWelcomeScreen: false
    }
  });

  // if first time starting HUD boot up the service worker
  if (navigator.serviceWorker.controller === null) {
    // temp time test
    localforage.setItem("starttime", startTime);

    parent.postMessage({ action: "hideAllDisplayFrames" }, document.referrer);

    localforage.setItem("is_first_load", true);

    startServiceWorker();
  } else {
    parent.postMessage({ action: "showAllDisplayFrames" }, document.referrer);

    // temp time test
    localforage.getItem("starttime").then(startT => {
      let currentTime = new Date().getTime();
      let diff = currentTime - parseInt(startT);
      console.log("Time (ms) to load UI: " + diff);
    });

    localforage.setItem(IS_SERVICEWORKER_REFRESHED, true);
    localforage.getItem("is_first_load").then(isFirstLoad => {
      localforage.setItem("is_first_load", false);

      if (isFirstLoad && SHOW_WELCOME_SCREEN) {
        parent.postMessage({ action: "expandManagement" }, document.referrer);
        app.showWelcomeScreen = true;
      }
    });

    window.addEventListener("message", windowMessageListener);
    navigator.serviceWorker.addEventListener(
      "message",
      serviceWorkerMessageListener
    );
    navigator.serviceWorker.controller.postMessage({
      action: "targetload",
      tabId: tabId,
      targetUrl: context.url
    });

    startHeartBeat();
  }
});

/*
 * Receive messages from the target domain, which is not trusted.
 * As a result we only accept messages that contain a shared secret generated and injected at runtime.
 * The contents of the messages should still be treated as potentially malicious.
 */
function windowMessageListener(event) {
  var message = event.data;
  if (!message.hasOwnProperty("sharedSecret")) {
    utils.log(
      LOG_WARN,
      "management.receiveMessage",
      "Message without sharedSecret rejected",
      message
    );
    return;
  } else if ("" === ZAP_SHARED_SECRET) {
    // A blank secret is used to indicate that this functionality is turned off
    utils.log(
      LOG_DEBUG,
      "management.receiveMessage",
      "Message from target domain ignored as on-domain messaging has been switched off"
    );
  } else if (message.sharedSecret === ZAP_SHARED_SECRET) {
    // These are the only messages we allow from the target site, validate and filter out just the info we are expecting
    var limitedData = {};
    limitedData.action = message.action;
    limitedData.tabId = message.tabId;
    switch (message.action) {
      case "showEnable.count":
        if (message.count === parseInt(message.count, 10)) {
          limitedData.count = message.count;
          navigator.serviceWorker.controller.postMessage(limitedData);
          return;
        }
        break;
      case "commonAlerts.showAlert":
        if (message.alertId === parseInt(message.alertId, 10)) {
          limitedData.alertId = message.alertId;
          navigator.serviceWorker.controller.postMessage(limitedData);
          return;
        }
        break;
      default:
        break;
    }
    utils.log(
      LOG_DEBUG,
      "management.receiveMessage",
      "Unrecognised message from target domain ignored",
      message
    );
  } else {
    utils.log(
      LOG_WARN,
      "management.receiveMessage",
      "Message with incorrect sharedSecret rejected",
      message
    );
  }
}

function serviceWorkerMessageListener(event) {
  var message = event.data;

  switch (message.action) {
    case "refreshTarget":
      parent.postMessage({ action: "refresh" }, document.referrer);
      break;

    case "showEnable.on":
      parent.postMessage({ action: "showEnable.on" }, document.referrer);
      break;

    case "showEnable.off":
      parent.postMessage({ action: "showEnable.off" }, document.referrer);
      break;

    case "showEnable.count":
      parent.postMessage({ action: "showEnable.count" }, document.referrer);
      break;

    case "commonAlerts.alert":
      parent.postMessage(message, document.referrer);
      break;

    case "showTutorial":
      showTutorial();
      break;

    default:
      console.log("Unexpected action " + message.action);
      break;
  }
}

/*
 * Starts the service worker and refreshes the target on success.
 */

function startServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register(utils.getZapFilePath("serviceworker.js"))
      .then(registration => {
        utils.log(
          LOG_INFO,
          "Service worker registration was successful for the scope: " +
            registration.scope
        );

        // wait until serviceworker is installed and activated
        return navigator.serviceWorker.ready;
      })
      .then(() => {
        // refresh the frames so the service worker can take control
        parent.postMessage({ action: "refreshAllFrames" }, document.referrer);
      })
      .catch(utils.errorHandler);
  } else {
    alert(
      "This browser does not support Service Workers. The HUD will not work."
    );
  }
}

/*
 * Starts sending heart beat messages to the ZAP API every 10 seconds
 */
function startHeartBeat() {
  setInterval(() => {
    navigator.serviceWorker.controller.postMessage({ action: "heartbeat" });
  }, 10000);
}
