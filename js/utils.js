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

export default {
	addInOrder,
	getReasonableTimestamp
}
