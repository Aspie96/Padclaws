const users = Vue.reactive({
	users: {},

	fetchMetadata(user) {
		if(!this.users[user]) {
			this.users[user] = {
				loading: true,
				refs: 1
			};
			nostrClient.fetchUserMetadata(user, data => {
				if(user in this.users) {
					this.users[user].data = data;
					this.users[user].loading = false;
				}
			});
		} else {
			this.users[user].refs++;
		}
		return this.users[user];
	}
});

export default users;
