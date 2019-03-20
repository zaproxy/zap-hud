<!-- alert list modal component -->
<template>
  <Modal :title="title" :show="show" @close="close">
    <div slot="body">
      <AlertAccordion
        v-for="(value, key) in alerts"
        :key="key"
        :title="key"
        :alerts="value"
        :port="port"
        @close="close"
        @open="open"
      ></AlertAccordion>
    </div>
  </Modal>
</template>

<script>
import { EventBus } from "../libs/event-bus.js";
import Modal from "./Modal.vue";
import AlertAccordion from "./AlertAccordion.vue";

export default {
  // template: "#alert-list-modal-template",
  props: ["show", "title"],
  components: {
    Modal,
    AlertAccordion
  },
  methods: {
    close: function() {
      this.$emit("close");
    }
  },
  data() {
    return {
      port: null,
      alerts: {}
    };
  },
  created() {
    let self = this;

    EventBus.$on("showAlertListModal", data => {
      //TODO: replace app (Vue context w/ props)
      app.isAlertListModalShown = true;
      app.alertListModalTitle = data.title;

      self.alerts = data.alerts;
      self.port = data.port;
    });
  }
};
</script>
