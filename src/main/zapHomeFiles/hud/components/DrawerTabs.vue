<template>
  <!-- TODO: Move height to scss -->
  <div style="height: 100%;">
    <div class="tabs">
      <ul class="tab">
        <li v-for="tab in tabs" :class="{ 'active': tab.isActive, 'tab-item': true }">
          <a
            :href="tab.href"
            @click="selectTab(tab)"
            :class="{ 'badge': tab.isBadgeData}"
            :data-badge="tab.badgeData"
          >{{ tab.name }}</a>
        </li>
        <!-- invisible tab-item to push tab-action buttons right -->
        <li class="tab-item tab-action-spacer"></li>
        <li class="tab-item tab-action">
          <DrawerButtonShowHide></DrawerButtonShowHide>
        </li>
        <li class="tab-item tab-action">
          <DrawerButtonSettings></DrawerButtonSettings>
        </li>
        <li class="tab-item tab-action">
          <button class="btn btn-action btn-sm" @click="toggleOpenClose">
            <i :class="{ 'icon': true, 'icon-arrow-up': isArrowUp, 'icon-arrow-down': !isArrowUp }"></i>
          </button>
        </li>
      </ul>
    </div>
    <div class="tabs-details drawer-details">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import localforage from "localforage";
import DrawerButtonShowHide from "./DrawerButtonShowHide.vue";
import DrawerButtonSettings from "./DrawerButtonSettings.vue";

export default {
  components: {
    DrawerButtonShowHide,
    DrawerButtonSettings
  },
  data() {
    return {
      tabs: [],
      isOpen: false,
      isArrowUp: true
    };
  },
  methods: {
    closeDrawer() {
      this.isOpen = false;
      this.isArrowUp = true;
      localforage
        .setItem("drawer.isDrawerOpen", false)
        .catch(utils.errorHandler);
      parent.postMessage(
        { tabId: tabId, frameId: frameId, action: "hideBottomDrawer" },
        document.referrer
      );
    },
    openDrawer() {
      this.isOpen = true;
      this.isArrowUp = false;
      localforage
        .setItem("drawer.isDrawerOpen", true)
        .catch(utils.errorHandler);
      parent.postMessage(
        { tabId: tabId, frameId: frameId, action: "showBottomDrawer" },
        document.referrer
      );
    },
    toggleOpenClose() {
      this.isOpen ? this.closeDrawer() : this.openDrawer();
    },
    selectTab(selectedTab) {
      if (!this.isOpen) {
        this.openDrawer();
        selectedTab.badgeData = 0;
      } else {
        if (selectedTab.isActive) {
          this.closeDrawer();
        }
      }

      localforage
        .setItem("drawer.activeTab", selectedTab.href)
        .catch(utils.errorHandler);

      this.highlightTab(selectedTab.href);
    },
    highlightTab(href) {
      this.tabs.forEach(tab => {
        tab.isActive = tab.href == href;
        if (tab.isActive) {
          tab.badgeData = 0;
        }
      });
    }
  },
  created() {
    this.tabs = this.$children;

    let promises = [
      localforage.getItem("drawer.isDrawerOpen"),
      localforage.getItem("drawer.activeTab")
    ];

    Promise.all(promises)
      .then(results => {
        let shouldOpenDrawer = results[0];
        let activeTab = results[1];

        if (activeTab) {
          this.highlightTab(activeTab);
        } else {
          this.highlightTab("#history");
        }

        if (shouldOpenDrawer) {
          this.openDrawer();
        }
      })
      .catch(utils.errorHandler);
  }
};
</script>

<style lang="scss" scoped>
</style>

