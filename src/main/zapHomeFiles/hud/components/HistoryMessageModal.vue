<template id="history-message-modal-template">
  <HttpMessageModal
    ref="messageModal"
    :title="title"
    :show="show"
    @close="close"
    :request="request"
    :response="response"
    :is-response-disabled="isResponseDisabled"
    :active-tab="activeTab"
  >
    <div slot="footer">
      <div>
        <span class="errorMessages">{{ errors }}</span>
      </div>
      <div class="float-left">
        <button :class="{'btn': true, 'disabled': isAscanDisabled}" @click="ascanRequest">
          <span v-t="'message.history_ascan_request'"></span>
          <img src="{{{ ZAP_HUD_FILES }}}?image=flame.png">
        </button>
      </div>
      <button class="btn btn-primary" @click="replay" v-t="'message.history_replay_console'"></button>
      <button class="btn" @click="replayInBrowser" v-t="'message.history_replay_browser'"></button>
    </div>
  </HttpMessageModal>
</template>

<script>
import { EventBus } from "../libs/event-bus.js";
import HttpMessageModal from "./HttpMessageModal";

export default {
  template: "#history-message-modal-template",
  props: ["show", "title"],
  components: {
    HttpMessageModal
  },
  methods: {
    close: function() {
      this.$emit("close");
    },
    replay: function() {
      let message = this.request;

      this.port.postMessage({
        buttonSelected: "replay",
        method: message.method,
        header: message.header,
        body: message.body
      });
      this.$emit("close");
    },
    replayInBrowser: function() {
      let self = this;
      let message = this.request;
      let channel = new MessageChannel();
      channel.port1.onmessage = function(event) {
        if (event.data.requestUrl) {
          window.top.location.href = event.data.requestUrl;
        } else {
          self.errors = I18n.t("error_invalid_html_header");
        }
      };
      navigator.serviceWorker.controller.postMessage(
        {
          action: "zapApiCall",
          component: "hud",
          type: "action",
          name: "recordRequest",
          params: { header: message.header, body: message.body }
        },
        [channel.port2]
      );
    },
    ascanRequest: function() {
      let req = this.request;
      this.$emit("close");
      //TODO: replace tabId, frameId w/ props
      navigator.serviceWorker.controller.postMessage({
        tabId: tabId,
        frameId: frameId,
        action: "ascanRequest",
        tool: "active-scan",
        uri: req.uri,
        method: req.method,
        body: req.body
      });
    }
  },
  data() {
    return {
      port: null,
      request: {},
      response: {},
      isAscanDisabled: true,
      isResponseDisabled: false,
      activeTab: "Request",
      errors: ""
    };
  },
  created() {
    let self = this;

    EventBus.$on("showHistoryMessageModal", data => {
      self.request = data.request;
      self.response = data.response;
      self.port = data.port;
      self.isResponseDisabled = data.isResponseDisabled;
      self.isAscanDisabled = data.isAscanDisabled;
      self.activeTab = data.activeTab;

      self.request.isReadonly = false;
      self.response.isReadonly = true;

      //TODO: replace app (Vue context w/ props)
      app.isHistoryMessageModalShown = true;
      app.HistoryMessageModalTitle = data.title;
    });
  }
};
</script>
