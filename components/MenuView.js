import Session from "../js/session.js"
import UsersCache from "./UsersCache.js"

export default {
	data() {
		return {
			Session
		};
	},

	created() {
		this.$watch(
			() => this.logged,
			this.fetchData,
			{ immediate: true }
		);
	},

	computed: {
		logged() {
			return Session.logged;
		},

		backPage() {
			if(this.$route.path == "/login") {
				return this.$route.query.page;
			}
			return this.$route.path;
		},

		username() {
			if(this.logged) {
				return UsersCache.users[Session.userKeys.public]?.metadata?.name;
			}
		}
	},

	methods: {
		fetchData() {
			if(this.logged) {
				UsersCache.fetchMetadata(Session.userKeys.public);
			}
		},

		toggleMenu() {
			document.body.classList.toggle("menu-open");
		},

		closeMenu() {
			document.body.classList.remove("menu-open");
		}
	},
 
	template: `
	<button type="button" id="menu-toggle" @click="toggleMenu">
		<span class="ti ti-menu-2"></span>
	</button>
	<div id="logo">
		<img src="img/logo.svg" />
	</div>
	<div id="occluder" @click="closeMenu"></div>
	<nav id="menu" @click="closeMenu">
		<ul>
			<li>
				<RouterLink :to="{ name: 'home' }">
					<span class="ti ti-home"></span>
					<span class="menu-option">Home</span>
				</RouterLink>
			</li>
			<template v-if="logged">
				<li>
					<RouterLink :to="{ name: 'feed' }">
						<span class="ti ti-antenna"></span>
						<span class="menu-option">Feed</span>
					</RouterLink>
				</li>
				<li>
					<RouterLink :to="{ name: 'notifications' }">
						<span class="ti ti-bell"></span>
						<span class="menu-option">Notifications</span>
					</RouterLink>
				</li>
				<li>
					<RouterLink :to="{ name: 'user', params: { pubkey: Session.userKeys.public } }">
						<span class="ti ti-user"></span>
						<span class="menu-option" v-if="username">
							<b>{{username}}</b>
						</span>
						<span class="menu-option profile-pubkey" v-else>{{Session.userKeys.public}}</span>
					</RouterLink>
				</li>
				<li>
					<RouterLink :to="{ name: 'settings-relays' }">
						<span class="ti ti-settings"></span>
						<span class="menu-option">Settings</span>
					</RouterLink>
				</li>
				<li>
					<button type="button" @click="Session.logout()">
						<span class="ti ti-logout"></span>
						<span class="menu-option">Log out</span>
					</button>
				</li>
				<li>
					<RouterLink :to="{ name: 'write' }">
						<span class="ti ti-pencil"></span>
						<span class="menu-option">Write note</span>
					</RouterLink>
				</li>
				<li>
					<RouterLink :to="{ name: 'docs', params: { page: 'privacy' } }">
						<span class="ti ti-spy"></span>
						<span class="menu-option">Privacy</span>
					</RouterLink>
				</li>
				<li>
					<a href="https://github.com/Aspie96/Padclaws">
						<span class="ti ti-code"></span>
						<span class="menu-option">Source code</span>
					</a>
				</li>
			</template>
			<template v-else>
				<li>
					<RouterLink :to="{ name: 'login', query: { page: backPage } }">
						<span class="ti ti-login"></span>
						<span class="menu-option">Log in</span>
					</RouterLink>
				</li>
				<li>
					<RouterLink :to="{ name: 'settings-relays' }">
						<span class="ti ti-settings"></span>
						<span class="menu-option">Settings</span>
					</RouterLink>
				</li>
				<li>
					<RouterLink :to="{ name: 'docs', params: { page: 'privacy' } }">
						<span class="ti ti-spy"></span>
						<span class="menu-option">Privacy</span>
					</RouterLink>
				</li>
				<li>
					<a href="https://github.com/Aspie96/Padclaws">
						<span class="ti ti-code"></span>
						<span class="menu-option">Source code</span>
					</a>
				</li>
			</template>
		</ul>
	</nav>
	`
}
