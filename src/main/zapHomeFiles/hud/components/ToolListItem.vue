<!-- select tool li component -->
<template id="tool-li-template">
    <li class="menu-item" @click="toolSelect()">
        <a href="#">
            <img :src="image" /> {{ label }}
        </a>
    </li>
</template>


<script>
export default {
	template: '#tool-li-template',
	props:['image', 'label', 'toolname', 'port'],
	methods: {
		close: function() {
			this.$emit('close');
		},
		toolSelect: function() {
			this.port.postMessage({'action': 'toolSelected', 'toolname': this.toolname})
			this.close();
		}
	}
}
</script>

<style lang="scss" scoped>

</style>
