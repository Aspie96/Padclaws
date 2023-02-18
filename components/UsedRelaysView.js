
export default {
	props: {
		relays: Array
	},

	emits: [
		"remove"
	],

	computed: {
		sortedRelays() {
			return this.relays.toSorted((a, b) => a[0].localeCompare(b[0]));
		}
	},

	template: `
	<fieldset class="relays-container">
		<legend>Used relays ({{ sortedRelays.length }})</legend>
		<div class="relay-used-box" v-for="([relay, config], index) in sortedRelays">
			<div class="relay-used">
				<button type="button" :id="'used-relay-' + index" @click="this.$emit('remove', relay)">
					<span class="ti ti-minus"></span>
				</button>
				<label :for="'used-relay-' + index" class="relay-uri">{{ relay }}</label>
			</div>
		</div>
	</fieldset>
	`
}
