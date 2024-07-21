import AlertView from "../AlertView.js"

export default {
	components: {
		AlertView
	},

	template: `
	<AlertView color="yellow" icon="alert-triangle">
		<p>No relays set.</p>
		<p>Before fetching data, you must add some <RouterLink :to="{ name: 'settings-relays' }">relays</RouterLink>.</p>
	</AlertView>
	`
}
