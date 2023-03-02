
export default {
	props: {
		relays: Array,
		legend: String
	},

	emits: [
		"add",
		"addAll"
	],

	template: `
	<fieldset class="relays-container">
		<legend>{{legend}} ({{ relays.length }})</legend>
		<div class="relay-known-box" v-for="(relay, index) in relays">
			<div class="relay-known">
				<button type="button" :id="'known-relay-' + index" @click="$emit('add', relay)">
					<span class="ti ti-plus"></span>
				</button>
				<label :for="'known-relay-' + index" class="relay-uri">{{ relay }}</label>
			</div>
		</div>
	</fieldset>
	<div class="form-buttons">
		<button type="button" class="relays-known-all-btn" @click="$emit('addAll')" :disabled="relays.length == 0">Add all</button>
	</div>
	`
}
