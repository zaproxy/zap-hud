<template id="break-message-modal-template">
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
      <button class="btn btn-primary" @click="step">{{ $t("message.break_step") }}</button>
      <button class="btn btn-primary" @click="continueOn">{{ $t("message.break_continue") }}</button>
      <button
        :class="{'btn': true, 'disabled': isDropDisabled}"
        @click="drop"
      >{{ $t("message.break_drop") }}</button>
    </div>
  </HttpMessageModal>
</template>

<script>
import { EventBus } from "../libs/event-bus.js";
import VueI18n from "vue-i18n";
import HttpMessageModal from "./HttpMessageModal";

export default {
  template: "#break-message-modal-template",
  props: ["show", "title"],
  components: {
    HttpMessageModal
  },
  methods: {
    close: function() {
      this.step();
      this.$emit("close");
    },
    step: function() {
      let message = this.$refs.messageModal.currentMessage;

      this.$emit("close");
      this.port.postMessage({
        buttonSelected: "step",
        tabId: tabId,
        method: message.method,
        header: message.header,
        body: message.body
      });
    },
    continueOn: function() {
      let message = this.$refs.messageModal.currentMessage;

      this.port.postMessage({
        buttonSelected: "continue",
        tabId: tabId,
        method: message.method,
        header: message.header,
        body: message.body
      });
      this.$emit("close");
    },
    drop: function() {
      //TODO: replace tabId, frameId w/ props
      this.port.postMessage({ buttonSelected: "drop", frameId: frameId });
      this.$emit("close");
    }
  },
  data() {
    return {
      port: null,
      request: {},
      response: {},
      isDropDisabled: false,
      isResponseDisabled: false,
      activeTab: I18n.t("common_request")
    };
  },
  created() {
    let self = this;

    EventBus.$on("showBreakMessageModal", data => {
      self.request = data.request;
      self.response = data.response;
      self.port = data.port;
      self.isResponseDisabled = data.isResponseDisabled;
      self.activeTab = data.activeTab;

      self.request.isReadonly = !data.isResponseDisabled;
      self.response.isReadonly = data.isResponseDisabled;

      // Only show the Drop option for things that dont look like a requests for a web page as this can break the HUD UI
      if (data.isResponseDisabled) {
        // Its a request
        let headerLc = data.request.header.toLowerCase();
        self.isDropDisabled = headerLc.match("accept:.*text/html");
        // Explicitly XHRs should be fine
        if (headerLc.match("x-requested-with.*xmlhttprequest")) {
          self.isDropDisabled = false;
        }
      } else {
        // Its a response
        let headerLc = data.response.header.toLowerCase();
        self.isDropDisabled = headerLc.match("content-type:.*text/html");
      }

      //TODO: replace app (Vue context w/ props)
      app.isBreakMessageModalShown = true;
      app.BreakMessageModalTitle = data.title;
    });

    EventBus.$on("closeAllModals", () => {
      this.$emit("close");
    });
  }
};
</script>

<style lang="scss" scoped>
</style>

