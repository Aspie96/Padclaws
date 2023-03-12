export default {
	props: {
		items: Array
	},

	data() {
		return {
			showMenu: false
		};
	},

	methods: {
		toggleMenu() {
			this.showMenu = !this.showMenu;
		},

		closeMenu(ev) {
			if(ev.target != this.$refs.button && !this.$refs.button.contains(ev.target)) {
				this.showMenu = false;
			}
		}
	},
 
	template: `
	<button type="button" class="note-menu-btn" @click="toggleMenu" ref="button">
		<span class="ti ti-menu-2"></span>
	</button>
	<nav v-if="showMenu" class="note-menu" @click="closeMenu" v-click-outside="closeMenu">
		<ul>
			<li v-for="item in items">
				<button type="button" @click="item.onClick"><span v-if="item.icon" class="ti" :class="'ti-' + item.icon"></span>{{ item.text }}</button>
			</li>
		</ul>
	</nav>
	`
}
