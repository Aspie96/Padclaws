const users = Vue.reactive({
	users: {},
	locked: false,
	lockList: [],

	fetchMetadata(user) {
		if(user in this.users) {
			this.users[user].refs++;
		} else {
			this.users[user] = {
				loading: true,
				refs: 1
			};
			if(this.locked) {
				if(!this.lockList.includes(user)) {
					this.lockList.push(user);
				}
			} else {
				nostrClient.fetchUserMetadata(user, (pubkey, metadata) => {
					if(user in this.users) {
						this.users[user].metadata = metadata;
						this.users[user].pubkey = pubkey;
						this.users[user].loading = false;
					}
					if(pubkey != user && pubkey in users.users) {
						this.users[pubkey].metadata = metadata;
						this.users[pubkey].loading = false;
					}
				});
			}
		}
		return this.users[user];
	},

	fetchMultipleMetadata(users) {
		if(this.locked) {
			for(const user of users) {
				if(!this.lockList.includes(user) && !(user in this.users)) {
					this.lockList.push(user);
				}
			}
		} else {
			const newUsers = [];
			for(const user of users) {
				if(!(user in this.users)) {
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
	},

	lock() {
		this.locked = true;
	},

	unlock() {
		this.locked = false;
		if(this.lockList.length > 0) {
			nostrClient.fetchUsersMetadata(this.lockList, (user, pubkey, metadata) => {
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
			this.lockList.length = 0;
		}
	}
});

export default users;
