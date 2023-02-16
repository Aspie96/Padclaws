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
	<form @submit.prevent="$emit('submit', note)">
		<textarea required v-model="note" name="note" :disabled="submitting" placeholder="Here's the problem with teleportation&hellip;"></textarea>
		<div class="form-buttons">
			<button type="submit" label-outputclass="btn-submit" :disabled="!note.trim() || submitting">Publish</button>
		</div>
	</form>
	<p v-if="noteId && !submitting" class="alert alert-blue">
		<span class="ti ti-check"></span>
		<span class="alert-text">Note published. <router-link :to="'/note/' + noteId">View note</router-link></span>
	</p>
	`
}
