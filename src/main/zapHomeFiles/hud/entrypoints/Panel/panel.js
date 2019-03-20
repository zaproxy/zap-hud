/*
 * Panel
 *
 * Description goes here...
 */

import Vue from "vue";
import { EventBus } from "../../libs/event-bus.js";
import Panel from "./Panel.vue";

document.addEventListener("DOMContentLoaded", () => {
  let params = new URL(document.location).searchParams;
  orientation = params.get("orientation");
  panelKey = orientation + "Panel";
  //TODO: Pass frameId in props down to HudButtons where it's referenced?
  // frameId = params.get('frameId');
  tabId = params.get("tabId");
  window.name = panelKey;

  new Vue({
    el: "#app",
    template: "<Panel/>",
    components: { Panel }
  });
});

function doesContextApply(toolContext) {
  return (
    toolContext.domain === context.domain ||
    toolContext.url === context.url ||
    toolContext.tabId === tabId ||
    ("notTabId" in toolContext && toolContext.notTabId != tabId) ||
    ("notDomain" in toolContext && toolContext.notDomain != context.domain) ||
    ("scope" in toolContext && toolContext.scope.includes(context.domain))
  );
}

navigator.serviceWorker.addEventListener("message", event => {
  var message = event.data;
  let tool;

  switch (message.action) {
    case "broadcastUpdate":
      tool = message.tool;

      if (message.context === undefined || doesContextApply(message.context)) {
        EventBus.$emit("updateButton", {
          isDisabled: message.isToolDisabled,
          name: tool.name,
          data: tool.data,
          icon: tool.icon,
          tool: tool
        });
      }

      break;

    case "updateData":
      tool = message.tool;

      EventBus.$emit("updateButton", {
        name: tool.name,
        data: tool.data,
        icon: tool.icon,
        tool: tool
      });
      break;

    case "addTool":
      tool = message.tool;
      EventBus.$emit("addButton", {
        name: tool.name,
        data: tool.data,
        icon: tool.icon,
        tool: tool
      });

      break;

    case "removeTool":
      tool = message.tool;

      EventBus.$emit("removeButton", {
        name: tool.name
      });
      break;

    default:
      break;
  }
});

/* sends message to inject script to expand or contract width of panel iframe */
function expandPanel() {
  var message = {
    action: "expandPanel",
    orientation: orientation
  };
  parent.postMessage(message, document.referrer);
}

function contractPanel() {
  var message = {
    action: "contractPanel",
    orientation: orientation
  };

  parent.postMessage(message, document.referrer);
}
