import WriteView from "../WriteView.js"

const keys = {
	private: "a1fefad8eb460a09d4b34a74a5d1570bdc6ffd6a062d417d1c3aba02c7a4343a",
	public: "6525360895fb155a5daf41e017ef5619d76fcc948f5d52635ce69ac498b09c3f"
};

export default {
	data() {
		return {
			submitting: false,
			noteId: null
		};
	},

	methods: {
		async onSubmit(note) {
			this.submitting = true;
			const event = await nostrClient.postNote(keys, note);
			this.submitting = false;
			this.noteId = event.id;
			this.$refs.writeView.note = "";
		}
	},

	components: {
		WriteView
	},

	template: `
	<write-view :submitting="submitting" @submit="onSubmit" :noteId="noteId" ref="writeView" />
	`
}
