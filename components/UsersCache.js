const users = Vue.reactive({
	users: {},

	fetchMetadata(user) {
		if(!this.users[user]) {
			this.users[user] = {
				loading: true,
				refs: 1
			};
			nostrClient.fetchUserMetadata(user, (pubkey, metadata) => {
				if(user in this.users) {
					this.users[user].metadata = metadata;
					this.users[user].pubkey = pubkey;
					this.users[user].loading = false;
				}
				if(pubkey != user && pubkey in this.users) {
					this.users[pubkey].metadata = metadata;
					this.users[pubkey].loading = false;
				}
			});
		} else {
			this.users[user].refs++;
		}
		return this.users[user];
	},

	fetchMultipleMetadata(users) {
		const newUsers = [];
		for(const user of users) {
			if(!this.users[user]) {
				this.users[user] = {
					loading: true,
					refs: 1
				};
				newUsers.push(user);
			} else {
				this.users[user].refs++;
			}
		}
		nostrClient.fetchUsersMetadata(newUsers, (user, pubkey, metadata) => {
			if(user in this.users) {
				this.users[user].metadata = metadata;
				this.users[user].pubkey = pubkey;
				this.users[user].loading = false;
			}
			if(pubkey != user && pubkey in this.users) {
				this.users[pubkey].metadata = metadata;
				this.users[pubkey].loading = false;
			}
		});
	}
});

export default users;
