var config = require("./config.json");
var axios = require("axios");

var instance = axios.create({
		baseURL: "https://jimeng.feie.work/api/v1/",
		headers: {
			"X-Authorization": `Bearer ${config.accessKey}:${config.accessSecret}`
		}
	});

exports.get = function (url, options) {
	return instance.get(url, options);
}

exports.post = function (url, options) {
	return instance.post(url, options);
}

exports.put = function (url, options) {
	return instance.put(url, options);
}

exports.patch = function (url, options) {
	return instance.patch(url, options);
}

exports.delete = function (url, options) {
	return instance.delete(url, options);
}

