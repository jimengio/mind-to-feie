exports.parse = function (filename) {
	var content = require(filename);

	if (!content.name) {
		return [];
	}

	var rootTopic = content;
	var rootNode = { title: rootTopic.name };
	extractChildren(rootTopic, rootNode);
	return [rootNode];
}

function extractChildren(topic, node) {
	if (topic.children && topic.children.length) {
		let childTopics = topic.children;

		node.children = [];
		childTopics.forEach(function (childTopic) {
			let childNode = { title: childTopic.name };
			node.children.push(childNode);

			extractChildren(childTopic, childNode);
		})
	}
}