export default {
	data() {
		return {
			note: ""
		};
	},

	props: {
		submitting: Boolean,
		noteId: null
	},

	emits: [
		"submit"
	],

	template: `
	<form>
		<textarea required v-model="note" :disabled="submitting" placeholder="Here's the problem with teleportation&hellip;"></textarea>
		<button type="submit" class="btn-submit" @click="$emit('submit', note)" :disabled="!note.trim() || submitting">Publish</button>
	</form>
	<p v-if="noteId && !submitting" class="alert alert-blue">
		<span class="ti ti-check"></span>
		<span class="alert-text">Note published. <router-link :to="'/note/' + noteId">View note</router-link></span>
	</p>
	`
}
