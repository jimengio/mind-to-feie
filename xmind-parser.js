const fs = require("fs");
const unzip = require("unzip");
const streamToString = require("stream-to-string");

exports.parse = async function (filename) {
	var contents = await parseContentJsonFromFile(filename);

	if (!contents) {
		throw new Error("XMind file parse error: content.json not found");
	}

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

function parseContentJsonFromFile(filename) {
	var result = new Promise(function (resolve, reject) {
		fs.createReadStream(filename)
			.pipe(unzip.Parse())
			.on('entry', function (entry) {
				if (entry.path === "content.json" && entry.type === "File") {
					streamToString(entry, function (err, str) {
						const obj = JSON.parse(str);
						resolve(obj);
					});
				} else {
					entry.autodrain();
				}
			})
			.on('close', function () {
				resolve(null);
			})
			.on('error', function (err) {
				reject(err);
			});
	});

	return result;
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