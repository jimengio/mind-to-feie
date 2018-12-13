var axios = require("axios");

module.exports = class FeieApi {
	constructor({domainKey, apiKey, apiSecret}) {
		this.instance = axios.create({
			baseURL: `https://${domainKey}.feie.work/api/v1/`,
			headers: {
				"X-Authorization": `Bearer ${apiKey}:${apiSecret}`
			}
		});
	}

	listSections({projectId}) {
		return this.instance.get("/sections", {
			params: {
				project_id: projectId,
			}
		})
		.then(function ({data}){
			return data.data;
		});
	};

	createSection(section) {
		return this.instance.post("/sections", section)
		.then(function ({data}) {
			return data.data;
		});
	};

	listCases({projectId, sectionId}) {
		return this.instance.get("/cases", {
			params: {
				project_id: projectId,
				section_id: sectionId,
			}
		})
		.then(function ({data}){
			return data.data;
		});
	};

	createCase(testCase) {
		return this.instance.post("/cases", testCase)
		.then(function ({data}) {
			return data.data;
		});
	};

	updateCase(testCase) {
		return this.instance.patch(`/cases/${testCase.id}`, testCase)
		.then(function ({data}) {
			return data.data;
		});
	};
};