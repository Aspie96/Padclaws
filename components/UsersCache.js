const users = Vue.reactive({
	users: {},

	fetchData(user) {
		if(!this.users[user]) {
			this.users[user] = {
				loading: true,
				refs: 1
			};
			nostrClient.getUserData(user).then(data => {
				this.users[user].data = data;
				this.users[user].loading = false;
			});
		} else {
			this.users[user].refs++;
		}
		return this.users[user];
	}
});

export default users;
