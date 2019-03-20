<template id="websocket-message-modal-template">
  <Modal :title="title" :show="show" size="wide" @close="close">
    <div slot="body">
      <table class="table table-striped table-hover">
        <tbody>
          <tr>
            <td>{{ $t("message.websockets_message_field_time") }}</td>
            <td>{{ time }}</td>
          </tr>
          <tr>
            <td>{{ $t("message.websockets_message_field_direction") }}</td>
            <td>{{ direction }}</td>
          </tr>
          <tr>
            <td>{{ $t("message.websockets_message_field_opcode") }}</td>
            <td>{{ opcode }}</td>
          </tr>
          <tr>
            <td>{{ $t("message.websockets_message_field_payload") }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <textarea
        class="form-input hud-websocket-message"
        rows="10"
        spellcheck="false"
        v-model="payload"
      ></textarea>
    </div>
    <div slot="footer">
      <button
        class="btn btn-primary"
        @click="replay"
        :disabled="isReplayDisabled"
      >{{ $t("message.websockets_replay") }}</button>
    </div>
  </Modal>
</template>

<script>
import { EventBus } from "../libs/event-bus.js";
import VueI18n from "vue-i18n";
import Modal from "./Modal.vue";

export default {
  template: "#websocket-message-modal-template",
  props: ["show", "title"],
  components: {
    Modal
  },
  methods: {
    close: function() {
      this.$emit("close");
    },
    replay: function() {
      this.port.postMessage({
        buttonSelected: "replay",
        channelId: this.channelId,
        outgoing: this.outgoing,
        message: this.payload
      });
      this.$emit("close");
    }
  },
  data() {
    return {
      port: null,
      time: null,
      direction: null,
      outgoing: null,
      opcode: null,
      channelId: null,
      payload: null,
      isReplayDisabled: false
    };
  },
  created() {
    let self = this;

    EventBus.$on("showWebSocketMessageModal", data => {
      let date = new Date(Number(data.msg.timestamp));
      self.time =
        date.getHours() +
        ":" +
        date.getMinutes() +
        ":" +
        date.getSeconds() +
        "." +
        date.getMilliseconds();
      self.payload = data.msg.payload;
      self.channelId = data.msg.channelId;
      self.outgoing = data.msg.outgoing;
      // The outgoing field is actually a string not a boolean
      if (data.msg.outgoing === "true") {
        self.direction = I18n.t("websockets_direction_outgoing");
      } else {
        self.direction = I18n.t("websockets_direction_incoming");
      }
      self.opcode = data.msg.opcodeString;
      self.isReplayDisabled = data.msg.opcodeString != "TEXT";
      self.port = data.port;

      //TODO: replace app (Vue context w/ props)
      app.isWebsocketMessageModalShown = true;
      app.websocketMessageModalTitle = data.title;
    });
  }
};
</script>

<style lang="scss" scoped>
</style>
