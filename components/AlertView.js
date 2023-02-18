export default {
	props: {
		color: String,
		icon: String
	},

	template: `
	<div :class="['alert', 'alert-' + color]">
		<span :class="['ti', 'ti-' + icon]"></span>
		<div class="alert-text">
			<slot/>
		</div>
	</div>
	`
}
