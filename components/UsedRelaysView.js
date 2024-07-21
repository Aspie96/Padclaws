
export default {
	props: {
		relays: Array,
		legend: String
	},

	emits: [
		"remove",
		"readWriteChange"
	],

	computed: {
		sortedRelays() {
			return this.relays;
		}
	},

	template: `
	<fieldset class="relays-container">
		<legend>{{legend}} ({{ sortedRelays.length }})</legend>
		<div class="relay-used-box" v-for="([relay, config], index) in sortedRelays">
			<div class="relay-used">
				<button type="button" :id="'used-relay-' + index" @click="this.$emit('remove', relay)">
					<span class="ti ti-minus"></span>
				</button>
				<label :for="'used-relay-' + index" class="relay-uri" :class="{ unused: !(config.read || config.write) }">{{ relay }}</label>
				<div class="io-option">
					<input type="checkbox" :id="'read-relay-' + index" @change="e => $emit('readWriteChange', relay, e.target.checked, config.write)" :checked="config.read" />
					<label :for="'read-relay-' + index">Read</label>
				</div>
				<div class="io-option">
					<input type="checkbox" :id="'write-relay-' + index" @change="e => $emit('readWriteChange', relay, config.read,  e.target.checked)" :checked="config.write" />
					<label :for="'write-relay-' + index">Write</label>
				</div>
			</div>
		</div>
	</fieldset>
	`
}
