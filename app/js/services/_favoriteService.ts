'use strict';

/// <reference path="../../lib/rxjs/ts/rx.all.ts" />

declare var jpoApp: any;

jpoApp.factory('favoriteBusiness', function(favoriteService) {

    var subject = new Rx.BehaviorSubject<number>();

    //Rx.Observable.select()

    subject.onNext(1452);
});