
export default {
	props: {
		relays: Array
	},

	methods: {
		onRelayClick(index) {
			this.$emit("remove", index);
		}
	},

	template: `
	<fieldset class="relays-container">
		<legend>Used relays</legend>
		<div class="relay-used-box" v-for="(relay, index) in relays" :key="relay">
			<div class="relay-used">
				<button type="button" :id="'used-relay-' + index" @click="onRelayClick(index)">
					<span class="ti ti-minus"></span>
				</button>
				<label :for="'used-relay-' + index" class="relay-uri">{{ relay }}</label>
			</div>
		</div>
	</fieldset>
	`
}
