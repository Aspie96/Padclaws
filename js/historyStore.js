var sessionData = sessionStorage.getItem("historyStore");
if(sessionData) {
	sessionData = JSON.parse(sessionData);
}
const data = new Map(sessionData);
const maxSize = 10;
var position = history.state?.position;
var current = history.state?.current;

addEventListener("beforeunload", () => {
	data.delete(position);
	sessionStorage.setItem("historyStore", JSON.stringify(Array.from(data.entries())));
});

function getData(key) {
	const object = data.get(history.state.position);
	if(object) {
		if(object.current == history.state.current) {
			return object.values[key];
		} else {
			data.delete(history.state.position);
		}
	}
}

function storeData(key, value) {
	var object = data.get(position);
	if(!object || object.current != current) {
		object = { current, values: {} };
		data.set(position, object);
	}
	object.values[key] = value;
	while(data.size > maxSize) {
		data.delete(data.keys().next());
	}
}

function setPositionAndCurrent(pos, curr) {
	position = pos;
	current = curr;
}

export default {
	getData,
	storeData,
	setPositionAndCurrent
};
