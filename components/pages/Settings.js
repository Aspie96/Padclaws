import AlertView from "../AlertView.js"
import UsersCache from "../UsersCache.js"

export default {
	template:`
	<div class="remove-margin">
		<h1>Settings</h1>
		<div class="settings">
			<nav class="side-menu">
				<ul>
					<li>
						<RouterLink to="/settings/relays">Relays</RouterLink>
					</li>
				</ul>
			</nav>
			<div class="settings-content">
				<RouterView />
			</div>
		</div>
	</div>
	`
}
