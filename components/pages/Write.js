import WriteView from "../WriteView.js"

const keys = {
	private: "864d9fdf8c798ad6a06bbc1063fce37b1d87faf785b52538ba7cf99fe1da937c",
	public: "19f3ac17bea0e3132a733cfed0b4bbcd4870a41eaaa0e84f3f2d151b54c2ed2d"
};

export default {
	data() {
		return {
			note: "",
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
		}
	},

	components: {
		WriteView
	},

	template: `
	<write-view :submitting="submitting" @submit="onSubmit" :noteId="noteId" />
	`
}
