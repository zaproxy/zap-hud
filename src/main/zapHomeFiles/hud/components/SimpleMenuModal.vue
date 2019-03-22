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
import NavModal from "./NavModal.vue";

export default {
  template: "#simple-menu-modal-template",
  props: ["show", "title"],
  components: {
    NavModal
  },
  methods: {
    close: function() {
      this.$emit("close");
    },
    itemSelect: function(itemId) {
      this.port.postMessage({ action: "itemSelected", id: itemId });
      this.close();
    }
  },
  data() {
    return {
      port: null,
      items: {}
    };
  },
  created() {
    let self = this;

    EventBus.$on("showSimpleMenuModal", data => {
      //TODO: replace app (Vue context w/ props)
      app.isSimpleMenuModalShown = true;
      app.simpleMenuModalTitle = data.title;

      self.items = data.items;
      self.port = data.port;
    });
  }
};
</script>

<style lang="scss" scoped>
</style>

