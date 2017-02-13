'use strict';

let Dto = require('../dto'),
	os = require('os');

function buildFolderContentDto(urlPath, files) {
	return new Dto.FolderContentDto()
		.setLinks(buildFolderLinks(urlPath))
		.setFiles(buildFilesLinks(files, urlPath));
}

function buildFolderLinks (urlPath) {
	return new Dto.ResourceLinksDto()
		.addLink(makeSelfLinkToRes(urlPath))
		.addLink(tryMakeFolderSelfPhysLink(urlPath))
		.addLink(tryMakeParentLink(urlPath));
}

function buildFilesLinks(files, urlPath) {
	return files.map(function (file) {
		return buildFileInfoDto(urlPath, file);
	});
}

function buildFileInfoDto(urlPath, file) {
	return new Dto.FileInfoDto({
    name: file.name,
    type: file.type,
    resourcesLinksDto: buildFileLinks(file, urlPath)
  });
}

function buildFileLinks(file, parentFolderPath) {
	return new Dto.ResourceLinksDto()
		.addLink(makeSelfLinkToRes(parentFolderPath, file))
		.addLink(tryMakeFileSelfPhysLink(parentFolderPath, file))
		.addLink(tryMakeSelfPlayLink(parentFolderPath, file));
}

function tryMakeFolderSelfPhysLink(folderPath) {
	if (!folderPath || folderPath === '/') {
		return;
	}
	return new Dto.LinkDto({ rel:'self.phys', href: folderPath});
}

function tryMakeFileSelfPhysLink(parentFolderPath, file) {
	let fullFilePath = null;
	if (os.platform() === "linux") { // TODO Stop here: cannot diff when first time show and cliquing to / to show inside
		parentFolderPath = (parentFolderPath === "/" ? "" : parentFolderPath);
		if (file.name.startsWith("~/")) {
			fullFilePath = parentFolderPath + file.name;
		} else if (file.name === "/") {
			fullFilePath = file.name;
		} else {
			fullFilePath = parentFolderPath + file.name;
		}
	} else {
		fullFilePath = (parentFolderPath || '') + file.name;
	}

	if (!fullFilePath || fullFilePath === '/') {
		return;
	}
	if (file.isDirectory()) {
		fullFilePath += "/";
	}

	return new Dto.LinkDto({ rel:'self.phys', href: fullFilePath });
}

function makeSelfLinkToRes(parentFolderPath, file) {
	// encode url, no '/' if just file
	// ^\/api\/explore\/(.*[\/])*$/
	var fullFilePath;
	if (file) {
		if (os.platform() === "linux") {
			parentFolderPath = (parentFolderPath === "/" ? "" : parentFolderPath);
			if (file.name.startsWith("~/")) {
				fullFilePath = parentFolderPath + file.name;
			} else if (file.name === "/") {
				fullFilePath = file.name;
			} else {
				fullFilePath = parentFolderPath + file.name;
			}

			if (file.isDirectory()) {
				fullFilePath += "/";
			}
		} else {
			fullFilePath = parentFolderPath + file.name;

			var pathTail = isBrowsableFile(file) ? '/' : '';
			fullFilePath = fullFilePath + pathTail;
		}
	} else {
		fullFilePath = parentFolderPath;
	}
	return new Dto.LinkDto({ rel:'self', href: '/api/explore' + fullFilePath });
}

function tryMakeParentLink(urlPath) {
	var upPath = tryMakeUpPath(urlPath);
	if (!upPath) {
		return;
	}
	return new Dto.LinkDto({ rel: 'parent', href: '/api/explore' + upPath });
}

function tryMakeUpPath(urlPath){
	var noTrailingSlash;
	if (urlPath.endsWith('/')) {
		noTrailingSlash = urlPath.substring(0, urlPath.length-1);
	} else {
		noTrailingSlash = urlPath;
	}
	var upPath = noTrailingSlash.substring(0, noTrailingSlash.lastIndexOf('/') + 1);
	return upPath;
}

function tryMakeSelfPlayLink(parentFolderPath, file) {
	if (file.type && file.type === 'F') {
		var fullFilePath = parentFolderPath + file.name;
		// TODO only when playable
		return new Dto.LinkDto({ rel:'self.play', href: '/api/media/play/path' + fullFilePath });
	}
}

function isBrowsableFile(file) {
	return !file.type || file.type === 'D';
}

module.exports = {
	toFolderContentDto: function (urlPath, files) {
		return buildFolderContentDto(urlPath, files);
	},

	toFileInfoDto: function (urlPath, file) {
		return buildFileInfoDto(urlPath, file);
	}
};
