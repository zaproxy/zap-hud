<template id="modal-template">
  <transition name="modal" @after-leave="afterLeave">
  <div :class="{ 'active': true, 'modal': true, 'modal-wd': isWide, 'modal-sm': isSmall }" id="modal-id" v-show="show">
      <a href="#close" class="modal-overlay" aria-label="Close" @click="close"></a>
      <div class="modal-container">
          <div class="modal-header">
              <slot name="header"></slot>
              <a href="#close" class="btn btn-clear float-right" aria-label="Close" @click="close"></a>
              <div class="modal-title h5">{{title}}</div>
          </div>

          <div class="modal-body">
              <slot name="body"></slot>
          </div>

          <div class="modal-footer">
              <slot name="footer"></slot>
          </div>
      </div>
  </div>
  </transition>
</template>

<script>
  export default {
    template: '#modal-template',
    props: ['show', 'title', 'text', 'size'],
    computed: {
      isWide: function() {
        return this.size === 'wide';
      },
      isSmall: function() {
        return this.size === 'small';
      }
    },
    methods: {
      close: function () {
        this.$emit('close');
      },
      afterLeave: function (el) {
        //TODO: replace app (Vue context w/ props)
        if (!app.keepShowing) {
          hideDisplayFrame();
        }
        app.keepShowing = false;
      }
    }
  }
</script>

<style lang="scss" scoped>

</style>

