import AlertView from "./AlertView.js"

export default {
	props: {
		submitting: Boolean,
		noteId: null,
		storageKey: null
	},

	data() {
		return {
			note: ""
		};
	},

	emits: [
		"submit"
	],

	methods: {
		saveFormDataState() {
			if(this.$props.storageKey) {
				sessionStorage.setItem(this.storageKey, this.note);
			}
		},

		clear() {
			this.note = "";
			sessionStorage.removeItem(this.storageKey);
		}
	},

	created() {
		if(this.storageKey) {
			this.note = sessionStorage.getItem(this.storageKey) || "";
		}
	},

	components: {
		AlertView
	},

	template: `
	<h1>New note</h1>
	<form @submit.prevent="$emit('submit', note)" @change="saveFormDataState">
		<textarea required v-model="note" name="note" :disabled="submitting" placeholder="Here's the problem with teleportation&hellip;"></textarea>
		<div class="form-buttons">
			<button type="submit" class="btn-submit" :disabled="!note.trim() || submitting">Publish</button>
		</div>
	</form>
	<AlertView v-if="noteId && !submitting" color="blue" icon="check">Note published. <RouterLink :to="{ name: 'note', params: { id: noteId } }">View note</RouterLink></AlertView>
	`
}
