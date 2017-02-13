var expect = require('chai').expect,
	chai = require("chai"),
	chaiAsPromised = require("chai-as-promised"),
	fileExplorerService = require('../../../infrastructure/services/fileExplorers'),
	_ = require('underscore'),
	os = require('os');

chai.use(chaiAsPromised);

var fileExplorer, winFileExplorer;

before(function() {
	fileExplorer = fileExplorerService.buildFileExplorerService();
	winFileExplorer = new fileExplorerService.WinFileExplorerService();
});

describe('FileExplorer', function() {
	it('should handle current os', function(){
		var currentOsFileExplorer = fileExplorerService.buildFileExplorerService();
		expect(currentOsFileExplorer.canHandleOs(os.platform())).to.be.true;
	});
});

describe('FileExplorer#Win', function() {
	it('should handle current os', function(){
		expect(winFileExplorer.canHandleOs('win32')).to.be.true;
	});

	it('should normalize a given path for current os path system', function(){
		var completePath = '/C:/Users/Sebastien/Music/Jean-Michel Jarre - Wooloomooloo.flac';
		expect(winFileExplorer.normalizePathForCurrentOs(completePath))
			.to.equal('C:\\Users\\Sebastien\\Music\\Jean-Michel Jarre - Wooloomooloo.flac');
	});

	it('should return carriage return line feed as new line', function(){
		expect(winFileExplorer.getNewLineConstant())
			.to.equal('\r\n');
	});

	it('should return \\\\ as network root', function(){
		expect(winFileExplorer.getNetworkRoot()).to.equal('\\\\');
	});

	it('should return ../ as level up path', function(){
		expect(winFileExplorer.getLevelUpPath()).to.equal('..\\');
	});

	it('should give available drive paths', function(){
		return winFileExplorer
			.getAvailableDrivesPathsAsync()
			.then(function(drives) {
				expect(drives.length).to.be.greaterThan(0);
			});
	});

	it('should read file for infos', function(){
		var urlPath = 'C:\\Users\\\sebastien.thibault\\Music\\Jean-Michel Jarre - Zoolook.flac';

		return winFileExplorer
			.readFileInfoAsync(urlPath)
			.then(function(fileInfo) {
				expect(fileInfo.name).to.be.equal('Jean-Michel Jarre - Zoolook.flac');
				expect(fileInfo.type).to.be.equal('F');
				expect(fileInfo.isRoot).to.be.equal(false);
				expect(fileInfo.filePath).to.be.equal(urlPath);
			});
	});

	it('should read folder content for infos', function(){
		var urlPath = 'C:\\Users\\\sebastien.thibault\\Music\\';

		return winFileExplorer
			.readFolderContentAsync(urlPath)
			.then(function(folderInfos) {
				expect(folderInfos.length).to.be.greaterThan(0);

				_.each(folderInfos, function(fi) {
					expect(fi.name);
					expect(fi.type);
					expect(fi.isRoot);
					expect(fi.filePath);
				});
			});
	});

});

describe('FileExplorer#Linux', function(){

});

describe('FileExplorer#MacOs', function(){

});
