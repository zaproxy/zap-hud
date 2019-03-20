<template>
  <div>
    <div class="tabs">
      <ul class="tab tab-block">
        <template v-for="(tab, index) in tabs">
          <li
            :class="{ 'active': tab.isActive, 'tab-item': true, 'disabled': tab.disabled }"
            :key="index"
          >
            <!-- TODO: This should be tab.name but build was failing? -->
            <a :href="tab.href" v-on:click="selectTab(tab)">{{ name }}</a>
          </li>
        </template>
      </ul>
    </div>
    <div class="tabs-details">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  // template: "#tabs-template",
  props: ["activetab"],
  data() {
    return {
      tabs: []
    };
  },
  methods: {
    selectTab(selectedTab) {
      this.tabs.forEach(tab => {
        tab.isActive = tab.href == selectedTab.href;
      });
    },
    changeTab(tabName) {
      let tabHref = "#" + tabName.toLowerCase().replace(/ /g, "-");

      this.tabs.forEach(tab => {
        tab.isActive = tab.href == tabHref;
      });
    }
  },
  watch: {
    activetab: function(tabName) {
      this.changeTab(tabName);
    }
  },
  created() {
    this.tabs = this.$children;
  }
};
</script>
