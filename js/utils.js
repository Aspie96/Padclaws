const re_link = /\b((?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#](?:\S*[^\s\.,!\?>\)\]\};\:\"\'])?)?)/gi;

function addInOrder(array, item, comp) {
	var index = 0;
	while(index < array.length && comp(item, array[index]) < 0) {
		index++;
	}
	array.splice(index, 0, item);
}

function getReasonableTimestamp(until, timestamp) {
	until = until || Math.round(Date.now() / 1000);
	var timespan = until - timestamp;
	return until - timespan * 2 - 1;
}

function* yieldText(text) {
	if(text != "") {
		yield {
			type: "text",
			value: text
		};
	}
}

function* findByRegex(text, regex, itemName, def) {
	var m;
	var index = 0;
	do {
		m = regex.exec(text);
		if(m) {
			const item = m[1];
			yield* def(text.slice(index, m.index));
			yield {
				type: itemName,
				value: item
			};
			index = m.index + m[0].length;
		}
	} while(m);
	yield* def(text.slice(index));
}

function findIElements(regex, itemName, find) {
	return text => findByRegex(text, regex, itemName, find);
}

function* tokenize(text, regexes, itemNames) {
	if(text == "") {
		yield {
			type: "text",
			value: ""
		};
	} else {
		var find = yieldText;
		for(var i = regexes.length - 1; i >= 0; i--) {
			const regex = regexes[i];
			const itemName = itemNames[i];
			find = findIElements(regex, itemName, find);
		}
		yield *find(text);
	}
}

export default {
	addInOrder,
	getReasonableTimestamp,
	tokenize,
	re_link
}
