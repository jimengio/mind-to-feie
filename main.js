var commander = require("commander");
var xmindParser = require("./xmind-parser");
var mmapParser = require("./mmap-parser");

var FeieApi = require("./feie-api");
var feieApi;

commander
	.version("0.1.0")
	.option("--domain-key <string>", "为团队登录地址前缀。")
	.option("--api-key <string>", "API key")
	.option("--api-secret <string>", "API secret")
	.option("--project-id <number>", "项目 id")
	.option("--file <string>", "要导入的文件路径")
	.option("--format <string>", "要导入的文件格式，默认为xmind格式。xmind | mmap")
	.option("--force-update", "当服务器上存在同名用例时强制更新")
	.parse(process.argv);

async function main() {
	if (!commander.domainKey) {
		console.error("请设置 --domain-key 参数。domain key 为团队登录地址前缀。");
		return;
	}

	if (!commander.apiKey) {
		console.error("请设置 --api-key 参数。API key 可以在飞蛾 API 服务页面的密钥管理中查询到。");
		return;
	}

	if (!commander.apiSecret) {
		console.error("请设置 --api-secret 参数。API secret 可以在飞蛾 API 服务页面的密钥管理中查询到。");
		return;
	}

	if (!commander.projectId) {
		console.error("请设置 --project-id 参数。");
		return;
	}

	if (!commander.file) {
		console.error("请设置 --file 参数。");
		return;
	}

	feieApi = new FeieApi({
		domainKey: commander.domainKey,
		apiKey: commander.apiKey,
		apiSecret: commander.apiSecret,
	});

	let projectId = commander.projectId;
	let fileName = commander.file;

	var rootNodes;
	if (commander.format === "mmap") {
		rootNodes = await mmapParser.parse(fileName);
	} else {
		rootNodes = await xmindParser.parse(fileName);
	}

	console.log(`Fetching sections from server '${commander.domainKey}.feie.work'...`)
	let sections = await feieApi.listSections({projectId: projectId});
	console.log(`${sections.length} sections fetched.`)

	let parentSectionId = 0;
	for(var rootNode of rootNodes) {
		await walkNodes(projectId, parentSectionId, rootNode.children, sections, []);
	}
}

main();

async function walkNodes(projectId, parentSectionId, nodes, sections, cases) {
	for(var node of nodes) {
		let testCase;
		let testSection;
		if (isSectionNode(node)) {
			let sectionNode = node;
			testSection = parseTestSectionFromNodeTitle(sectionNode.title);
			testSection.project_id = projectId;
			testSection.parent_id = parentSectionId;

			// Find or create section on server
			let sectionOnServer = sections.find((item) => item.parent_id === parentSectionId && item.name === testSection.name);
			if (!sectionOnServer) {
				console.log(`Creating section '${testSection.name}'...`);
				try {
					sectionOnServer = await feieApi.createSection(testSection);
					console.log(`Section '${testSection.name}' created.`);
					sections.push(sectionOnServer);
				} catch(error) {
					console.log(`Failed to create section:`);
					console.log(error.response.data);
				}
			} else {
				console.log(`Section '${testSection.name}' exists, no need to create.`);
			}

			let casesOfSectionOnServer = await feieApi.listCases({
				projectId: projectId,
				sectionId: sectionOnServer.id,
			});

			if (sectionOnServer && sectionNode.children) {
				await walkNodes(projectId, sectionOnServer.id, sectionNode.children, sections, casesOfSectionOnServer);
			}
		} else if (isCaseNode(node)) {
			let caseNode = node;
			let stepNodes = caseNode.children || [];

			testCase = parseTestCaseFromNodeTitle(caseNode.title);
			testCase.project_id = projectId;
			testCase.section_id = parentSectionId;
			let steps = [];
			stepNodes.forEach(function (stepNode) {
				if (!stepNode.children || !stepNode.children.length
					&& stepNode.title.startsWith("@")) {
					testCase.precondition = stepNode.title.substring(1).trim();
				} else if (stepNode.children && stepNode.children.length === 1) {
					steps.push({content: stepNode.title, expected: stepNode.children[0].title});
				}
			})
	
			if (steps.length === 1) {
				testCase.template_type = "TEXT";
				testCase.content = steps[0].content;
				testCase.expected = steps[0].expected;
			} else {
				testCase.template_type = "STEPS";
				testCase.steps = steps;
			}
	
			let caseOnServer = cases.find((item) => item.title === testCase.title);
			if (!caseOnServer) {
				console.log(`Creating case '${testCase.title}'...`);
				try {
					caseOnServer = await feieApi.createCase(testCase);
					console.log(`Case '${caseOnServer.title}' created.`);
				} catch(error) {
					console.log(`Failed to create case:`);
					console.log(error.response.data);
				}
			// } else if (shouldUpdateCase(caseOnServer, testCase)) {
			} else if (commander.forceUpdate) {
				console.log(`Updating case '${testCase.title}'...`);
				try {
					caseOnServer.template_type = testCase.template_type;
					caseOnServer.content = testCase.content;
					caseOnServer.expected = testCase.expected;
					caseOnServer.steps = testCase.steps;
					caseOnServer = await feieApi.updateCase(caseOnServer);
					console.log(`Case '${caseOnServer.title}' updated.`);
				} catch(error) {
					console.log(`Failed to create case:`);
					console.log(error.response.data);
				}
			} else {
				console.log(`Case '${testCase.title}' exists, no need to create.`);
			}
		}
	}
}

function shouldUpdateCase(caseOnServer, caseToSave) {
	console.log(caseOnServer);
	console.log(caseToSave);
	if (caseOnServer.template_type !== caseToSave.template_type) {
		return true;
	}

	if (caseOnServer.template_type === "TEXT" &&
		(caseOnServer.content !== caseToSave.content || caseOnServer.expected !== caseToSave.expected)) {
		return true;
	}

	if (caseOnServer.steps.length !== caseToSave.steps.length) {
		return true;
	}

	for(var i = 0; i < caseOnServer.steps.length; i++) {
		let stepOnServer = caseOnServer.steps[i];
		let stepToSave = caseToSave.steps[i];
		if (stepOnServer.content !== stepToSave.content ||
				stepOnServer.expected !== stepToSave.expected) {
			return true;
		}
	}

	return false;
}

function isSectionNode(node) {
	return node.title.startsWith("#");
}

function isCaseNode(node) {
	return node.title.startsWith("*");
}

function parseTestSectionFromNodeTitle(title) {
	var testSection = {name: ""};
	if (title.startsWith("#")) {
		testSection.name = title.substring(1);
	}
	return testSection;
}

function parseTestCaseFromNodeTitle(title) {
	var testCase = {title: ""};
	if (title.startsWith("*")) {
		testCase.title = title.substring(1);
	}
	return testCase;
}
