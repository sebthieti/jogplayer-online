describe('jogplayer online logon', function() {
	it('should logon to app', function() {
		browser.get('http://localhost:10000/');

		//element(by.model('todoList.todoText')).sendKeys('write first protractor test');
		element(by.css('#loginForm input#username')).sendKeys('sebthieti');
		element(by.css('#loginForm input#password')).sendKeys('seb');
		element(by.css('#loginForm [type="submit"]')).click();

		var showWelcome = element(by.css('#welcome-screen > div'));
		expect(showWelcome).toBeDefined();

		//var todoList = element.all(by.repeater('todo in todoList.todos'));
		//expect(todoList.count()).toEqual(3);
		//expect(todoList.get(2).getText()).toEqual('write first protractor test');
		//
		//// You wrote your first test, cross it off the list
		//todoList.get(2).element(by.css('input')).click();
		//var completedAmount = element.all(by.css('.done-true'));
		//expect(completedAmount.count()).toEqual(2);
	});

});
