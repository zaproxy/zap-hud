<template id="alert-details-modal-template">
  <NavModal :title="title" :show="show" @close="close" @back="back">
    <div slot="body">
      <table class="table table-striped table-hover">
        <tbody>
          <tr>
            <td v-t="'message.alerts_field_url'"></td>
            <td @click="messageSelected(details.messageId)">
              <a href="#">{{ details['url'] }}</a>
            </td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_description'"></td>
            <td>{{ details['description'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_risk'"></td>
            <td>{{ details['risk'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_confidence'"></td>
            <td>{{ details['confidence'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_parameter'"></td>
            <td>{{ details['parameter'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_attack'"></td>
            <td>{{ details['attack'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_evidence'"></td>
            <td>{{ details['evidence'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_cweid'"></td>
            <td>{{ details['cweid'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_wascid'"></td>
            <td>{{ details['wascid'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_other'"></td>
            <td>{{ details['other'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_solution'"></td>
            <td>{{ details['solution'] }}</td>
          </tr>
          <tr>
            <td v-t="'message.alerts_field_reference'"></td>
            <td v-if="details['reference']">
              <li v-for="link in details['reference'].split('\n')">
                <a :href="link" target="_top">{{ link }}</a>
              </li>
            </td>
            <td v-else></td>
          </tr>
        </tbody>
      </table>
    </div>
  </NavModal>
</template>

<script>
import { EventBus } from "../libs/event-bus.js";
import NavModal from "./NavModal.vue";

export default {
  template: "#alert-details-modal-template",
  props: ["show", "title"],
  components: {
    NavModal
  },
  methods: {
    close: function() {
      this.$emit("close");
    },
    messageSelected: function(id) {
      //TODO: replace tabId, frameId w/ props
      navigator.serviceWorker.controller.postMessage({
        tabId: tabId,
        frameId: frameId,
        action: "showHttpMessageDetails",
        tool: "history",
        id: id
      });
    },
    back: function() {
      //TODO: replace app (Vue context w/ props)
      app.keepShowing = true;
      app.isAlertDetailsModalShown = false;
      this.port.postMessage({ back: true });
    }
  },
  data() {
    return {
      port: null,
      details: {}
    };
  },
  created() {
    let self = this;

    EventBus.$on("showAlertDetailsModal", data => {
      //TODO: replace app (Vue context w/ props)
      app.isAlertDetailsModalShown = true;
      app.alertDetailsModalTitle = data.title;

      self.details = data.details;
      self.port = data.port;
    });
  }
};
</script>

<style lang="scss" scoped>
</style>