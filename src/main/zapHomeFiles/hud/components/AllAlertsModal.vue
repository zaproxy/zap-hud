<template>
  <Modal :title="title" :show="show" @close="close">
    <div slot="body">
      <Tabs :activetab="activeTab">
        <Tab :name="$t('message.alerts_risk_high')" :selected="true">
          <AlertAccordion
            v-for="(value, key) in alerts['High']"
            :key="key"
            :title="key"
            :alerts="value"
            :port="port"
            @close="close"
          ></AlertAccordion>
        </Tab>

        <Tab :name="$t('message.alerts_risk_medium')">
          <AlertAccordion
            v-for="(value, key) in alerts['Medium']"
            :key="key"
            :title="key"
            :alerts="value"
            :port="port"
            @close="close"
          ></AlertAccordion>
        </Tab>

        <Tab :name="$t('message.alerts_risk_low')">
          <AlertAccordion
            v-for="(value, key) in alerts['Low']"
            :key="key"
            :title="key"
            :alerts="value"
            :port="port"
            @close="close"
          ></AlertAccordion>
        </Tab>

        <Tab :name="$t('message.alerts_risk_info')">
          <AlertAccordion
            v-for="(value, key) in alerts['Informational']"
            :key="key"
            :title="key"
            :alerts="value"
            :port="port"
            @close="close"
          ></AlertAccordion>
        </Tab>
      </Tabs>
    </div>
  </Modal>
</template>        

<script>
import { EventBus } from "../libs/event-bus.js";
import VueI18n from "vue-i18n";
import Modal from "./Modal.vue";
import Tabs from "./Tabs.vue";
import Tab from "./Tab.vue";
import AlertAccordion from "./AlertAccordion.vue";

export default {
  // template: "#all-alerts-modal-template",
  props: ["show", "title"],
  components: {
    AlertAccordion,
    Tabs,
    Tab
  },
  methods: {
    close: function() {
      this.$emit("close");
    }
  },
  data() {
    return {
      port: null,
      alerts: {},
      activeTab: I18n.t("alerts_risk_high")
    };
  },
  created: function() {
    let self = this;

    EventBus.$on("showAllAlertsModal", data => {
      //TODO: replace app (Vue context w/ props)
      app.isAllAlertsModalShown = true;
      app.allAlertsModalTitle = data.title;

      self.alerts = data.alerts;
      self.port = data.port;
      self.activeTab = data.risk;
    });
  }
};
</script>

<style lang="scss" scoped>
</style>

  