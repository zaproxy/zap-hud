<template id="dialog-modal-template">
    <Modal :title="title" :show="show" @close="close">
        <div slot="body">
            <div class="content">
                <span v-html="text">
            </div>
        </div>
        <div slot="footer">
            <button v-for="button in buttons" class="btn" v-text="button.text" @click="buttonClick(button.id)"></button>
        </div>
    </Modal>
</template>

<script>
  import { EventBus } from '../libs/event-bus.js';
  import VueI18n from "vue-i18n";
  import Modal from './Modal.vue'

  export default {
	  template: '#dialog-modal-template',
    props: ['show', 'title', 'text'],
    components: {
      Modal
    },
	  methods: {
		  close: function() {
			  this.$emit('close');
		  },
		  buttonClick: function(id) {
			  this.port.postMessage({'action': 'dialogSelected', id: id});
			  this.close();
		  }
	  },
	  data() {
		  return {
			  port: null,
			  buttons: [
				  {text: I18n.t("common_ok"), id:"okay"},
				  {text: I18n.t("common_cancel"), id:"cancel"}
			  ]
		  }
	  },
	  created: function() {
		  let self = this;

		  EventBus.$on('showDialogModal', data => {

        //TODO: replace app (Vue context w/ props)
			  app.isDialogModalShown = true;
			  app.dialogModalTitle = data.title;
			  app.dialogModalText = data.text;

			  self.buttons = data.buttons;
			  self.port = data.port;
		  })
	  }
  }
</script>