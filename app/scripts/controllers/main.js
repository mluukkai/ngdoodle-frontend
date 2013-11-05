'use strict';

var app = angular.module('doodleFrontendApp');

app.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.headers.get = {'Accept':'application/json'};
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);

/*
 *
 *  Factories
 *
 */

//app.value('BASE_URL', 'http://localhost:3000');
app.value('BASE_URL', 'http://ng-doodle-backend.herokuapp.com');

app.factory('Flash', function() {
  var flash = {};

  flash.show = false;
  return flash;
});

/*
 *
 *  Filters
 *
 */

app.filter('twodigits', function(){
   return function(value){
        if (value>9) {
            return ""+value;
        } else {
            return "0"+value;
        }
   };
});

/*
 *
 *  EventsCtrl
 *
 */

app.controller('EventsCtrl', function ($scope, $http, BASE_URL) {
    $scope.visible = false;

    $http.get(BASE_URL+'/events.json').success( function(data) {
        $scope.events = data;
    });
});

/*
 *
 *  RegisterSearchCtrl
 *
 */

app.controller('RegisterSearchCtrl', function($scope, $http, $location) {
    $scope.click = function() {
        $location.path( "/register/"+$scope.eid );    
    }
});    

/*
 *
 *  RegisterCtrl
 *
 */

app.controller('RegisterCtrl', function($scope, $http, $routeParams, BASE_URL) {
    var slotIndex = function(slot) {
        for(var i in $scope.event.slots ) {
            var s = $scope.event.slots[i];
            if ( s.id==slot.id ) {
                return i;
            }
        }        
    }

    var mark = function(slot, name) {
        console.log($scope.event.slots[ slotIndex(slot) ]);
        $scope.event.slots[ slotIndex(slot) ].registrations.push({name:name});
    }

    var unMark = function(slot, index) {
        $scope.event.slots[ slotIndex(slot) ].registrations.splice(index,1);
    }

    $scope.hasMarked = function(slot, name) {
        var names = [];
        angular.forEach(slot.registrations, function(reg){
            names.push(reg.name);
        });

        return names.indexOf(name)!=-1;
    }

    $scope.buttonFor = function(slot, name) {
        if ( $scope.hasMarked(slot,name)) {
            return "cancel";
        } else {
            return "register";
        }
    }

    $http.get(BASE_URL+'/register/'+$routeParams.id).success( function(data) {
        $scope.event = data;

        $scope.names = [];
        $scope.slots = $scope.event.slots;

        angular.forEach(data.slots, function(slot) {
            angular.forEach(slot.registrations, function(reg){
                if ( $scope.names.indexOf(reg.name)==-1 ) {
                    $scope.names.push(reg.name);
                }          
            });
        }); 
    });     

    $scope.register = function (slot) {
        console.log(slot);
        console.log($scope.name);

        var postData = { 
            slot_id:slot.id, 
            name:$scope.name
        };      

        var registrationIndexAndId = function(slot, name) {
            for ( var i in slot.registrations ) {
                var reg = slot.registrations[i];

                if (reg.name == name ) {
                    return { index: i, id:reg.id };
                }
            }
        }

        if ( $scope.hasMarked(slot, $scope.name) ) {
            var indexAndId = registrationIndexAndId(slot,$scope.name);
            console.log( indexAndId );

            $http.delete(BASE_URL+'/registrations/'+indexAndId.id +'.json', postData)
                .success(function (data, status, headers, config) {
                    console.log(data);
                    unMark(slot, indexAndId.index );
                }).error(function (data, status, headers, config) {
                    console.log("unauthorized");
                });
        } else {
            $http.post(BASE_URL+'/registrations.json', postData)
                .success(function (data, status, headers, config) {
                    console.log(data);
                    mark(slot, $scope.name);
                }).error(function (data, status, headers, config) {
                    console.log("unauthorized");
                });
        }       
    }
});

/*
 *
 *  EventCtrl
 *
 */

app.controller('EventCtrl', function($scope, $http, $routeParams, Flash, BASE_URL) {
    var setDefaultValues = function () {
        $scope.newSlot = {};
        $scope.newSlot.mm = 0;
        $scope.newSlot.hh = 12;
    }

    var indexOf = function (slot, slots) {
        for (var i in slots) {
            var s = slots[i];
            if ( s.hh == slot.hh && s.mm == slot.mm && s.date == slot.date ) {
                return i;
            } 
        }
    }

    $scope.flashClicked = function () {
        $scope.flash = false;
        Flash.show = false;    
    }

    $scope.deleteSlot = function(slot) {
        $http.delete(BASE_URL+'/slots/'+slot.id+'.json')
            .success(function (data, status, headers, config) {
                var index = indexOf(slot, $scope.event.slots);
                $scope.event.slots.splice(index, 1);
            }).error(function (data, status, headers, config) {
                console.log("unauthorized");
            });
    }

    $scope.createSlot = function() {
        var postData = { 
            event_id:$routeParams.id, 
            text:$scope.newSlot.text,
            hh:$scope.newSlot.hh,
            mm:$scope.newSlot.mm,
            date:$scope.newSlot.date 
        };

        setDefaultValues();
        
        $http.post(BASE_URL+'/slots.json', postData)
            .success(function (data, status, headers, config) {
                $scope.event.slots.push(data);
            }).error(function (data, status, headers, config) {
                console.log("unauthorized");
            });
    }

	$http.get(BASE_URL+'/events/'+$routeParams.id+'.json').success( function(data) {
        $scope.event = data;
        $scope.flash = Flash.show;
    });	

    setDefaultValues();
});

/*
 *
 *  NewEventCtrl
 *
 */

app.controller('NewEventCtrl', function ($scope, $http, $location, Flash, BASE_URL) {
    $scope.flashaa = function(){
        Flash.show = true;
    }

    $scope.create = function() {
        var postData = { name:$scope.newEvent.name, description:$scope.newEvent.description }
        $scope.newEvent = {};
        $http.post(BASE_URL+'/events.json', postData)
            .success(function (data, status, headers, config) {
                console.log(data);
                Flash.show = true;
                $location.path( "/events/"+data.id );
            }).error(function (data, status, headers, config) {
                console.log("unauthorized");
            });
    };

});