import Vue from "vue";
import Drawer from "./Drawer.vue";
import { EventBus } from "../../libs/event-bus";
import { i18n } from "../../libs/i18n";

document.addEventListener("DOMContentLoaded", () => {
  let params = new URL(document.location).searchParams;

  //TODO: Pass frameId and tabId as props
  // frameId = params.get("frameId");
  // tabId = params.get("tabId");

  /* Vue app */
  app = new Vue({
    i18n,
    el: "#app",
    template: "<Drawer/>",
    components: { Drawer },
    data: {}
  });
});

navigator.serviceWorker.addEventListener("message", event => {
  var action = event.data.action;
  var port = event.ports[0];

  switch (action) {
    case "updateMessages":
      EventBus.$emit("updateMessages", {
        messages: event.data.messages,
        port: port
      });

      break;
    case "updateWebSockets":
      EventBus.$emit("updateWebSockets", {
        messages: event.data.messages,
        port: port
      });

      break;
  }
});
