import Vue from "vue";
import Display from "./Display.vue";
import { EventBus } from "../../libs/event-bus";
import { i18n } from "../../libs/i18n";

//TODO: Refactor tabId and frameId as props
let tabId = "";
let frameId = "";

document.addEventListener("DOMContentLoaded", () => {
  let params = new URL(document.location).searchParams;

  frameId = params.get("frameId");
  tabId = params.get("tabId");

  /* Vue app */
  new Vue({
    i18n,
    el: "#app",
    template: "<Display/>",
    components: { Display },
    data: {
      isDialogModalShown: false,
      dialogModalTitle: "",
      dialogModalText: "text",
      isSelectToolModalShown: false,
      isAlertListModalShown: false,
      alertListModalTitle: I18n.t("alerts_title"),
      isAllAlertsModalShown: false,
      allAlertsModalTitle: I18n.t("alerts_all_title"),
      isAlertDetailsModalShown: false,
      alertDetailsModalTitle: I18n.t("alerts_details_title"),
      isSimpleMenuModalShown: false,
      simpleMenuModalTitle: I18n.t("common_menu_title"),
      isBreakMessageModalShown: false,
      breakMessageModalTitle: I18n.t("break_http_message_title"),
      isHistoryMessageModalShown: false,
      historyMessageModalTitle: I18n.t("history_http_message_title"),
      isWebsocketMessageModalShown: false,
      websocketMessageModalTitle: I18n.t("websockets_message_title"),
      isSiteTreeModalShown: false,
      siteTreeModalTitle: I18n.t("sites_tool"),
      keepShowing: false
    }
  });
});

navigator.serviceWorker.addEventListener("message", event => {
  var action = event.data.action;
  var config = event.data.config;
  var port = event.ports[0];

  switch (action) {
    case "showDialog":
      EventBus.$emit("showDialogModal", {
        title: config.title,
        text: config.text,
        buttons: config.buttons,
        port: port
      });

      showDisplayFrame();
      break;

    case "showAddToolList":
      EventBus.$emit("showSelectToolModal", {
        tools: config.tools,
        port: port
      });

      showDisplayFrame();
      break;

    case "showAlerts":
      EventBus.$emit("showAlertListModal", {
        title: config.title,
        alerts: config.alerts,
        port: port
      });

      showDisplayFrame();
      break;

    case "showAllAlerts":
      EventBus.$emit("showAllAlertsModal", {
        title: config.title,
        alerts: config.alerts,
        port: port,
        risk: config.risk
      });

      showDisplayFrame();
      break;

    case "showAlertDetails":
      EventBus.$emit("showAlertDetailsModal", {
        title: config.title,
        details: config.details,
        port: port
      });

      showDisplayFrame();
      break;

    case "showButtonOptions":
      EventBus.$emit("showSimpleMenuModal", {
        title: config.toolLabel,
        items: config.options,
        port: port
      });

      showDisplayFrame();
      break;

    case "showHudSettings":
      EventBus.$emit("showSimpleMenuModal", {
        title: I18n.t("settings_title"),
        items: config.settings,
        port: port
      });

      showDisplayFrame();
      break;

    case "showBreakMessage":
      EventBus.$emit("showBreakMessageModal", {
        title: I18n.t("break_intercept_title"),
        request: config.request,
        response: config.response,
        isResponseDisabled: config.isResponseDisabled,
        activeTab: config.activeTab,
        port: port
      });

      showDisplayFrame();
      break;

    case "showHistoryMessage":
      EventBus.$emit("showHistoryMessageModal", {
        title: I18n.t("history_http_message_title"),
        request: config.request,
        response: config.response,
        isResponseDisabled: config.isResponseDisabled,
        isAscanDisabled: config.isAscanDisabled,
        activeTab: config.activeTab,
        port: port
      });

      showDisplayFrame();
      break;

    case "showWebSocketMessage":
      EventBus.$emit("showWebSocketMessageModal", {
        title: I18n.t("websockets_message_title"),
        msg: config,
        port: port
      });

      showDisplayFrame();
      break;

    case "showSiteTree":
      EventBus.$emit("showSiteTreeModal", {
        title: I18n.t("sites_tool"),
        port: port
      });

      showDisplayFrame();
      break;

    case "showHtmlReport":
      let channel = new MessageChannel();

      channel.port1.onmessage = function(event) {
        // Open window and inject the HTML report
        window.open("").document.body.innerHTML = event.data.response;
      };
      navigator.serviceWorker.controller.postMessage(
        {
          action: "zapApiCall",
          component: "core",
          type: "other",
          name: "htmlreport"
        },
        [channel.port2]
      );

      break;

    case "closeModals":
      if (config && config.notTabId != tabId) {
        EventBus.$emit("closeAllModals", {
          port: port
        });
      }
      break;

    default:
      break;
  }
});

/* the injected script makes the main frame visible */
function showDisplayFrame() {
  return utils.messageWindow(
    parent,
    { action: "showMainDisplay" },
    document.referrer
  );
}

/* the injected script makes the main frame invisible */
function hideDisplayFrame() {
  parent.postMessage({ action: "hideMainDisplay" }, document.referrer);
}
