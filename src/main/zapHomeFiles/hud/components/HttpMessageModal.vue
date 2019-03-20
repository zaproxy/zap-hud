<template id="http-message-modal-template">
  <Modal :title="title" :show="show" size="wide" @close="close">
    <div slot="body">
      <Tabs :activetab="activeTab">
        <Tab :name="$t('message.common_request')" selected="true">
          <textarea
            class="form-input hud-http-message"
            rows="10"
            spellcheck="false"
            v-model="request.header"
            :readonly="request.isReadonly"
          ></textarea>
          <textarea
            class="form-input hud-http-message"
            rows="10"
            spellcheck="false"
            v-model="request.body"
            :readonly="request.isReadonly"
          ></textarea>
        </Tab>

        <Tab :name="$t('message.common_response')" :disabled="isResponseDisabled">
          <textarea
            class="form-input hud-http-message"
            rows="10"
            spellcheck="false"
            v-model="response.header"
            :readonly="response.isReadonly"
          ></textarea>
          <textarea
            class="form-input hud-http-message"
            rows="10"
            spellcheck="false"
            v-model="response.body"
            :readonly="response.isReadonly"
          ></textarea>
        </Tab>
      </Tabs>
    </div>
    <div slot="footer">
      <slot name="footer"></slot>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal.vue";
import Tabs from "./Tabs.vue";
import Tab from "./Tab.vue";

export default {
  template: "#http-message-modal-template",
  components: {
    Modal,
    Tabs,
    Tab
  },
  props: [
    "show",
    "title",
    "request",
    "response",
    "is-response-disabled",
    "active-tab"
  ],
  methods: {
    close: function() {
      this.$emit("close");
    }
  },
  computed: {
    currentMessage() {
      let method = "";
      let header = "";
      let body = "";

      if (!this.response.isReadonly) {
        header = this.response.header;
        body = this.response.body;
      } else {
        method = this.request.method;
        header = this.request.header;
        body = this.request.body;
      }

      return { method: method, header: header, body: body };
    }
  }
};
</script>

<style lang="scss" scoped>
</style>