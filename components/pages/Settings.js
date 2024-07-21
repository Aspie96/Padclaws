import Session from "../../js/session.js"

export default {
	computed: {
		logged() {
			return Session.logged;
		}
	},

	template:`
	<div class="remove-margin">
		<h1>Settings</h1>
		<div class="settings">
			<nav class="side-menu">
				<ul>
					<li>
						<RouterLink :to="{ name: 'settings-relays' }">Relays</RouterLink>
					</li>
					<li v-if="logged">
						<RouterLink :to="{ name: 'settings-profile' }">Profile</RouterLink>
					</li>
					<li>
						<RouterLink :to="{ name: 'settings-data' }">Data</RouterLink>
					</li>
				</ul>
			</nav>
			<div class="settings-content">
				<RouterView :logged="logged" />
			</div>
		</div>
	</div>
	`
}
