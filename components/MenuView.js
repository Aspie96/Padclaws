import Session from "../js/session.js"

export default {
	data() {
		return {
			Session
		};
	},

	computed: {
		backPage() {
			if(this.$route.path == "/login") {
				return this.$route.query.page;
			}
			return this.$route.path;
		}
	},

	methods: {
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
	<nav id="menu" @click="closeMenu">
		<ul>
			<li>
				<router-link to="/">
					<span class="ti ti-home"></span>
					<span class="menu-option">Home</span>
				</router-link>
			</li>
			<template v-if="Session.logged">
				<li>
					<router-link to="/relays">
						<span class="ti ti-pencil"></span>
						<span class="menu-option">Relays</span>
					</router-link>
				</li>
				<li>
					<button type="button" @click="Session.logout()">
						<span class="ti ti-logout"></span>
						<span class="menu-option">Log out</span>
					</button>
				</li>
				<li>
					<router-link to="/write">
						<span class="ti ti-pencil"></span>
						<span class="menu-option">Write note</span>
					</router-link>
				</li>
			</template>
			<li v-else>
				<router-link :to="{ path: '/login', query: { page: backPage } }">
					<span class="ti ti-login"></span>
					<span class="menu-option">Log in</span>
				</router-link>
			</li>
			<li>
				<router-link to="/note/446e3abdddb3d10b9958ac0f4cdfef92081729994ffa26b35de2bb25bdd4cbd9">
					<span class="ti ti-info-square-rounded"></span>
					<span class="menu-option">About</span>
				</router-link>
			</li>
			<li>
				<router-link to="/feed/31c0536a78f3d4a79fa7e1aacde914e2f16d8be5dc7f7dbd7f844a6d3358b78a">
					<span class="menu-option">Go to About</span>
				</router-link>
			</li>
		</ul>
	</nav>
	`
}
