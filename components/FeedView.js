import NoteView from "./NoteView.js"

export default {
	props: {
		notes: Array
	},

	components: {
		NoteView
	},

	template: `
	<NoteView v-for="note in notes" :key="note.id" :note="note" />
	`
}
