async function waitAndFetch(users, user) {
	if(user in users.locked) {
		await users.locked[user];
		if(!(user in users.locked)) {
			return;
		}
	}
	console.log("Fetching user: " + user);
	nostrClient.fetchUserMetadata(user, (pubkey, metadata) => {
		if(user in users.users) {
			users.users[user].metadata = metadata;
			users.users[user].pubkey = pubkey;
			users.users[user].loading = false;
		}
		if(pubkey != user && pubkey in users.users) {
			users.users[pubkey].metadata = metadata;
			users.users[pubkey].loading = false;
		}
	});
}

const users = Vue.reactive({
	users: {},
	locked: {},

	fetchMetadata(user) {
		if(this.users[user]) {
			this.users[user].refs++;
		} else {
			this.users[user] = {
				loading: true,
				refs: 1
			};
			waitAndFetch(this, user);
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
			} else if(user in this.locked) {
				delete this.locked[user];
				this.users[user].refs++;
				newUsers.push(user);
			} else {
				this.users[user].refs++;
			}
		}
		console.log(newUsers);
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
