'use strict';

var Dto = require('../dto');

var buildFolderContentDto = function(urlPath, files) {
	return new Dto.FolderContentDto()
		.setLinks(buildFolderLinks(urlPath))
		.setFiles(buildFilesLinks(files, urlPath));
};

var buildFolderLinks = function (urlPath) {
	return new Dto.ResourceLinksDto()
		.addLink(makeSelfLinkToRes(urlPath))
		.addLink(tryMakeFolderSelfPhysLink(urlPath))
		.addLink(tryMakeParentLink(urlPath));
};

var buildFilesLinks = function (files, urlPath) {
	return files.map(function (file) {
		return new Dto.FileInfoDto(
			file.name,
			file.type,
			buildFileLinks(file, urlPath)
		);
	});
};

var buildFileLinks = function(file, parentFolderPath) {
	return new Dto.ResourceLinksDto()
		.addLink(makeSelfLinkToRes(parentFolderPath, file))
		.addLink(tryMakeFileSelfPhysLink(parentFolderPath, file))
		.addLink(tryMakeSelfPlayLink(parentFolderPath, file));
};

var tryMakeFolderSelfPhysLink = function (folderPath) {
	if (!folderPath || folderPath === '/') {
		return;
	}
	return new Dto.LinkDto('self.phys', folderPath);
};

var tryMakeFileSelfPhysLink = function (parentFolderPath, file) {
	var fullFilePath = (parentFolderPath || '') + file.name;
	if (!fullFilePath || fullFilePath === '/') {
		return;
	}

	return new Dto.LinkDto('self.phys', fullFilePath);
};

var makeSelfLinkToRes = function (parentFolderPath, file) {
	// encode url, no '/' if just file
	// ^\/api\/explore\/(.*[\/])*$/
	var fullFilePath;
	if (file) {
		fullFilePath = parentFolderPath + file.name;
		var pathTail = isBrowsableFile(file) ? '/' : '';
		fullFilePath = fullFilePath + pathTail;
	} else {
		fullFilePath = parentFolderPath;
	}
	return new Dto.LinkDto('self', '/api/explore' + fullFilePath);
};

var tryMakeParentLink = function (urlPath) {
	var upPath = tryMakeUpPath(urlPath);
	if (!upPath) {
		return;
	}
	return new Dto.LinkDto('parent', '/api/explore' + upPath);
};

var tryMakeUpPath = function(urlPath){
	var noTrailingSlash;
	if (urlPath.endsWith('/')) {
		noTrailingSlash = urlPath.substring(0, urlPath.length-1);
	} else {
		noTrailingSlash = urlPath;
	}
	var upPath = noTrailingSlash.substring(0, noTrailingSlash.lastIndexOf('/') + 1);
	return upPath;
};

var tryMakeSelfPlayLink = function (parentFolderPath, file) {
	if (file.type && file.type === 'F') {
		var fullFilePath = parentFolderPath + file.name;
		// TODO only when playable
		return new Dto.LinkDto('self.play', '/api/media/play/path' + fullFilePath);
	}
};

var isBrowsableFile = function(file) {
	return !file.type || file.type === 'D';
};

module.exports = {

	toFolderContentDto: function (urlPath, files) {
		return buildFolderContentDto(urlPath, files);
	}

};