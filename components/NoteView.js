export default {
	props: {
		note: Object,
		loading: Boolean
	},

	template: `
	<p v-if="loading" class="alert alert-blue">
		<span class="ti ti-hourglass"></span>
		<span class="alert-text">Loading&hellip;</span>
	</p>
	<article class="note-box" v-if="note">
		<router-link class="user-pubkey" :title="note.author" :to="'/feed/' + note.author">{{ note.author }}</router-link>
		<router-link class="note-date" :to="'/note/' + note.id">
			<time :datetime="note.date.toISOString()">{{ note.date.toLocaleString() }}</time>
		</router-link>
		<div class="note-content">{{ note.content }}</div>
	</article>
	`
}
