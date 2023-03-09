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
				<router-link :to="{ name: 'home' }">
					<span class="ti ti-home"></span>
					<span class="menu-option">Home</span>
				</router-link>
			</li>
			<template v-if="logged">
				<li>
					<router-link :to="{ name: 'user', params: { pubkey: Session.userKeys.public } }">
						<span class="ti ti-user"></span>
						<span class="menu-option" v-if="username">{{username}}</span>
						<span class="menu-option profile-pubkey" v-else>{{Session.userKeys.public}}</span>
					</router-link>
				</li>
				<li>
					<router-link :to="{ name: 'settings-relays' }">
						<span class="ti ti-settings"></span>
						<span class="menu-option">Settings</span>
					</router-link>
				</li>
				<li>
					<button type="button" @click="Session.logout()">
						<span class="ti ti-logout"></span>
						<span class="menu-option">Log out</span>
					</button>
				</li>
				<li>
					<router-link :to="{ name: 'write' }">
						<span class="ti ti-pencil"></span>
						<span class="menu-option">Write note</span>
					</router-link>
					<li>
						<router-link :to="{ name: 'docs', params: { page: 'privacy' } }">
							<span class="ti ti-spy"></span>
							<span class="menu-option">Privacy</span>
						</router-link>
					</li>
				</li>
			</template>
			<template v-else>
				<li>
					<router-link :to="{ name: 'login', query: { page: backPage } }">
						<span class="ti ti-login"></span>
						<span class="menu-option">Log in</span>
					</router-link>
				</li>
				<li>
					<router-link :to="{ name: 'settings-relays' }">
						<span class="ti ti-settings"></span>
						<span class="menu-option">Settings</span>
					</router-link>
				</li>
				<li>
					<router-link :to="{ name: 'docs', params: { page: 'privacy' } }">
						<span class="ti ti-spy"></span>
						<span class="menu-option">Privacy</span>
					</router-link>
				</li>
			</template>
		</ul>
	</nav>
	`
}
