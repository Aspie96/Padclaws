export default {
	props: { },

	data() {
		return {
			isMenuOpen: false
		};
	},

	template: `
	<button type="button" id="menu-toggle" @click="isMenuOpen = !isMenuOpen">
		<span class="ti ti-menu-2"></span>
	</button>
	<nav id="menu" :class="{ menuOpen: isMenuOpen }">
		<ul>
			<li>
				<router-link to="/">
					<span class="ti ti-home"></span>
					<span class="menu-option">Home</span>
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
			<li>
				<router-link to="/write">
					<span class="ti ti-pencil"></span>
					<span class="menu-option">Write note</span>
				</router-link>
			</li>
		</ul>
	</nav>
	`
}
