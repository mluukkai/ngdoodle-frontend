'use strict';

angular.module('doodleFrontendApp', [
  'ngCookies',
  'ngSanitize'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/events', {
        templateUrl: 'views/main.html',
        controller: 'EventsCtrl'
      })
      .when('/events/:id', {
        templateUrl: 'views/event.html',
        controller: 'EventCtrl'
      })
      .when('/register/:id', {
        templateUrl: 'views/register.html',
        controller: 'RegisterCtrl'
      })
      .when('/register', {
        templateUrl: 'views/registerSearch.html',
        controller: 'RegisterSearchCtrl'
      })
      .when('/new_event', {
        templateUrl: 'views/new_event.html',
        controller: 'NewEventCtrl'
      })
      .when('/helmet', {
        templateUrl: 'views/helmet.html',
        controller: 'HelmetCtrl'
      })
      .when('/library', {
        templateUrl: 'views/library.html',
        controller: 'LibraryCtrl'
      })
      .otherwise({
        redirectTo: '/events'
      });
  });
