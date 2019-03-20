<template>
  <div class="accordion">
    <input type="checkbox" :id="title" name="accordion-checkbox" hidden>
    <label class="accordion-header" :for="title">{{ title }} {{ urlCount }}</label>
    <div class="accordion-body">
      <ul class="menu menu-nav">
        <li class="menu-item" v-for="alert in alerts">
          <!-- TODO: This should be alert.url but build was failing? -->
          <a @click="alertSelect(alert)">{{ url }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  // template: "#alert-accordion-template",
  props: ["title", "alerts", "port", "key"],
  // props: {
  //   title: String,
  //   alerts: Array,
  //   port: Number,
  //   key: String
  // },
  methods: {
    close: function() {
      this.$emit("close");
    },
    urlCount: function() {
      return this.alerts.length;
    },
    alertSelect: function(alert) {
      // set keepShowing so that we don't hide the display frame
      //TODO: replace app (Vue context w/ props)
      app.keepShowing = true;
      app.isAlertListModalShown = false;
      app.isAllAlertsModalShown = false;

      this.port.postMessage({ action: "alertSelected", alertId: alert.id });
    }
  }
};
</script>

<style lang="scss" scoped>
</style>

