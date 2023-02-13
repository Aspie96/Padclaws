import NoteView from "./NoteView.js";

export default {
	props: {
		notes: Array
	},

	components: {
		NoteView
	},

	template: `
	<template v-for="note in notes">
		<note-view :note="note" />
	</template>
	`
}
