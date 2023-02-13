export default {
	data() {
		return {
			note: ""
		}
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
		<label for="note">Note:</label>
		<textarea id="note" required v-model="note" :disabled="submitting"></textarea>
		<button type="submit" class="btn-submit" @click="$emit('submit', note)" :disabled="!note.trim() || submitting">Submit</button>
	</form>
	<p v-if="noteId && !submitting">
		<router-link :to="'/note/' + noteId">Published</router-link>
	</p>
	`
}
