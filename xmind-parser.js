exports.parse = function (filename) {
	var contents = require(filename);

	if (!contents.length) {
		return [];
	}

	var nodes = [];

	contents.forEach(function (content) {
		var rootTopic = content.rootTopic;
		var rootNode = { title: rootTopic.title };
		extractChildren(rootTopic, rootNode);
		nodes.push(rootNode);
	});
	return nodes;
}

function extractChildren(rawTopic, node) {
	if (rawTopic.children && rawTopic.children.attached && rawTopic.children.attached.length) {
		let childTopics = rawTopic.children.attached;

		node.children = [];
		childTopics.forEach(function (childTopic) {
			let childNode = { title: childTopic.title };
			node.children.push(childNode);

			extractChildren(childTopic, childNode);
		})
	}
}