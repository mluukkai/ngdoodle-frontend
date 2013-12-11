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

app.factory('Library', function() {
    var library = {};
    return library;
});

app.factory('Events', function($http, BASE_URL) {
    var events = {};

    events.query = function() {
        return $http.get(BASE_URL+'/events.json');        
    }

    events.get = function (id) {
        return $http.get(BASE_URL+'/events/'+id+'.json');
    }

    events.by_identifier = function (eid) {
        return $http.get(BASE_URL+'/register/'+eid+'.json');
    }

    events.save = function (data) {
        return $http.post(BASE_URL+'/events.json', data);
    }

    return events;
});


app.factory('Slots', function($http, BASE_URL) {
    var slots = {};

    slots.save = function (data) {
        return $http.post(BASE_URL+'/slots.json', data);
    }

    slots.delete = function (id) {
        return $http.delete(BASE_URL+'/slots/'+id+'.json');
    }

    return slots;
});

app.factory('Registrations', function($http, BASE_URL) {
    var regs = {};

    regs.delete = function (id) {
        return $http.delete(BASE_URL+'/registrations/'+id +'.json');
    }

    regs.save = function (data) {
        return $http.post(BASE_URL+'/registrations.json', data);
    }

    return regs;
});

app.factory('Helmet', function($http, $q, BASE_URL) {
    var helmet = {};

    helmet.getBooksByAuthor = function(author, page) {
        var deferred = $q.defer();
        var data = JSON.parse(window.localStorage.getItem(author+"-"+page));

        if ( data!=null ) {
            console.log("was in cache");
            deferred.resolve(data);
        } else {
            console.log("will fetch from server");

            var specify_page = "";
            if ( page>1 ) {
                specify_page = "&page="+page;
            }

            $http.jsonp("http://data.kirjastot.fi/search/author.json?query="+author+specify_page+"&callback=JSON_CALLBACK")
                .success(function(data, status, headers, config){
                    window.localStorage.setItem(author+"-"+page, JSON.stringify(data)); 
                    console.log(data);
                    deferred.resolve(data); 
                }).error(function(data, status, headers, config){
                    deferred.reject("error...");
                });
        }    

        return deferred.promise;
    }

    helmet.getShelfInfo = function(book) {
        var b_id = book.library_id.substring(11);
        return $http.get(BASE_URL+'/bookinfo/'+b_id);    
    }

    return helmet;
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

app.filter('stripTrailingSpace', function(){
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    return function(value){
        if ( value!=null && endsWith(value, " / ")) {
            return value.substring(0, value.length-3);
        } 

        return value;
    };
});

app.filter('slashToSpace', function(){
    function replaceAll(string, pattern, replacement){
        while ( string.indexOf(pattern)!=-1 ) {
            string = string.replace(pattern, replacement);
        }

        return string;
    }

    return function(value){
        if (value==null) {
            return null;
        }

        return replaceAll(value, "\\", " ");
    };
});

/*
 *
 *  LibraryCtrl
 *
 */

app.controller('LibraryCtrl', function($scope, Library, $http) {
    $scope.info = Library.details || JSON.parse(window.localStorage.getItem("details"));
    $scope.location = Library.myLocation || JSON.parse(window.localStorage.getItem("location"));

    var nolocation = window.localStorage.getItem("nolocation");  
    $scope.nolocation = (nolocation=="undefined") ? false: JSON.parse(nolocation); 

    $scope.mapVisible = false;
    $scope.mapLoaded = false;

    function setPoint(latitude, longitude, name) {
        var location = new google.maps.LatLng(latitude, longitude);
        var point = new google.maps.Marker({
            position: location,
            map: $scope.map,
            title: name
        });

        return point;
    }

    function initialize(latitude, longitude) {
        $scope.directionsDisplay = new google.maps.DirectionsRenderer();
        var directionsService = new google.maps.DirectionsService();

        var mapOptions = {
            disableDefaultUI: true,
            center: libraryLocation,
            zoom: 13
        };

        $scope.map = new google.maps.Map(document.getElementById("map-canvas"),mapOptions);
        $scope.directionsDisplay.setMap($scope.map);

        var libraryLocation = new google.maps.LatLng(latitude, longitude);
        var currentLocation = new google.maps.LatLng($scope.location.latitude, $scope.location.longitude);

        setTimeout(function(){
            google.maps.event.trigger($scope.map, 'resize');
            $scope.map.setCenter(libraryLocation);
        },100);

        setPoint(latitude, longitude, $scope.info['name_fi']);
        setPoint($scope.location.latitude, $scope.location.longitude, "current location");

        $scope.calcRoute = function() {
            //var selectedMode = document.getElementById('mode').value;
            var request = {
                origin: currentLocation,
                destination: libraryLocation,
                travelMode: google.maps.TravelMode['DRIVING']
            };
            directionsService.route(request, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    $scope.directionsDisplay.setDirections(response);
                }
            });
        }

        //$scope.calcRoute();
    }

    $scope.carRoute = false;
    $scope.routeCaculated = false;

    $scope.showCarRoute = function(){
        if ( !$scope.routeCaculated) {
            $scope.calcRoute();
            $scope.routeCaculated = true;
        } else  {          
            $scope.directionsDisplay.setMap($scope.map);
        } 
        $scope.carRoute = true;      
    }

    $scope.hideCarRoute = function(){
        $scope.directionsDisplay.setMap(null);
        $scope.carRoute = false;
    }

    $scope.showMap = function () {
        if ( !$scope.mapLoaded ) {
            initialize($scope.info['latitude'], $scope.info['longitude']);   
            $scope.mapLoaded = true;            
        }

        $scope.mapVisible = !$scope.mapVisible;
    }

    $http.get("http://localhost:3000/canned").success(function(data, status, headers, config){
        console.log(data);
        //$scope.route = data;
    }).error(function(data, status, headers, config){
        console.log("error");
        console.log(status);
    });


    $scope.drawPath = function (locations) {
        var coords = _(locations).map( function(item){ return item.coord } );
  
        var coordinates = [];

        _($scope.points).each(function(point) {
            coordinates.push( point );
        });

        var path = new google.maps.Polyline({
            path: coordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        path.setMap($scope.map);
    }

    $scope.showLeg = function (locations) {
        var coords = _(locations).map( function(item){ return item.coord } );
        //console.log(coords);
        
        var coordinates = [];
        _(coords).each(function(coord) {
            coordinates.push( new google.maps.LatLng(coord['y'], coord['x']));
        });

        var wp = [];

        var len = Math.min(9, coordinates.length-1);

        for( var i=1; i<len; i++ ) {
            wp.push({location:coordinates[i], stopover:true});            
        }

        var request = {
            origin: coordinates[0],
            destination: coordinates[coordinates.length-1],
            waypoints: wp,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.TRANSIT
        };

        var directionsDisplay = new google.maps.DirectionsRenderer();
        var directionsService = new google.maps.DirectionsService();

        directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            }
        });

        directionsDisplay.setMap($scope.map);
    }

    $scope.showRoute = function () {
        var url = "http://localhost:3000/hsl?"+
                "clatitude="+$scope.location.latitude+"&clongitude="+$scope.location.longitude+
                "&dlatitude="+$scope.info['latitude']+"&dlongitude="+$scope.info['longitude']

        $http.get(url).success(function(data, status, headers, config){
            console.log(data);
            $scope.route = data;
        }).error(function(data, status, headers, config){
            console.log("error");
            console.log(status);
        });
    }

    var route = function(latitude, longitude){
        var libraryLocation = new google.maps.LatLng(latitude, longitude);
        var currentLocation = new google.maps.LatLng($scope.location.latitude, $scope.location.longitude);
    
        var req = {
            origin: libraryLocation,
            destination: currentLocation,
            travelMode: google.maps.DirectionsTravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        var req2 = {
            origin: "Malmi",
            destination: "Pasila",
            travelMode: google.maps.DirectionsTravelMode.TRANSIT,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        var directionsService = new google.maps.DirectionsService();

        directionsService.route(req, function(result, status){
            console.log(result);
            $scope.points  = result.routes[0]['overview_path'];
        });
    }

    route($scope.info['latitude'], $scope.info['longitude']);

    $scope.drawLeg = function (leg) {
        var libraryLocation = new google.maps.LatLng(latitude, longitude);
        var currentLocation = new google.maps.LatLng($scope.location.latitude, $scope.location.longitude);

        var req = {
            origin: "Malmi",
            destination: "Pasila",
            travelMode: google.maps.DirectionsTravelMode.TRANSIT,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        var directionsService = new google.maps.DirectionsService();

        directionsService.route(req, function(result, status){
            console.log(result);
            $scope.points  = result.routes[0]['overview_path'];
        });        
    }

});

/*
 *
 *  HelmetCtrl
 *
 */

app.controller('HelmetCtrl', function ($scope, Helmet, Library, $location, $timeout) {
    $scope.location = { 'latitude': 60.17, 'longitude':24.94}
    var last = window.sessionStorage.getItem("last");  
    $scope.author = (last=="undefined") ? '': JSON.parse(last);  
    //$scope.author = "Luukkainen";
    $scope.library = {};
    $scope.flash = {};
    $scope.no_shelf_info = {};
    var locationSet = false;

    $timeout(function() {
        if ( !locationSet ) {
            $scope.flash.nolocation = true; 
        } 
    }, 1000);
    

    navigator.geolocation.getCurrentPosition( function(location) {
        $scope.location = { 
                            'latitude': location.coords.latitude,
                            'longitude': location.coords.longitude
                          }
        locationSet = true;                                          
        $scope.$apply();                  
    } );

    $scope.select = function(library, info) {
        $scope.library.selected = library;
        $scope.library.details = info['library'];
        Library.selected = library;
        Library.details = info['library'];
        Library.myLocation = $scope.location;
        window.localStorage.setItem('selected', JSON.stringify(library));
        window.localStorage.setItem('details', JSON.stringify(info['library']));
        window.localStorage.setItem('location', JSON.stringify($scope.location));
        window.sessionStorage.setItem('last', JSON.stringify($scope.author));
        window.localStorage.setItem('nolocation', JSON.stringify($scope.flash.nolocation));

        $location.path('/library');
    }

    $scope.dist = function (lat1,lon1,lat2,lon2) {
        function deg2rad(deg) {
            return deg * (Math.PI/180)
        }

        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1); 
        var a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d.toFixed(2);
    }

    var author_details = function(book) {
        var names = book.author_details.length==0 || book.author_details[0].name==null ? [] : book.author_details[0].name.split("\\");
        var roles = book.author_details.length==0 || book.author_details[0].role==null ? [] : book.author_details[0].role.split("\\");

        return  _.zip(names, roles);
    }

    $scope.isEmptyOrUndefinded = function (obj) {
        if (obj===undefined) return true;
        return Object.keys(obj).length === 0;
    }

    $scope.shelfInfo = function(book) {
        $scope.flash[book.library_id] = true; 

        if ( book.library_id.substring(11)==="b1856375" ) {
            console.log(window.localStorage.getItem("kirja"));
            book.shelfInfo = JSON.parse(window.localStorage.getItem("kirja"));
            $scope.flash[book.library_id] = false;
            return;   
        } 

        Helmet.getShelfInfo(book).success( function(data){
            book.shelfInfo = data; 
            $scope.flash[book.library_id] = false;
            if ( Object.keys(data).length === 0) {
                $scope.no_shelf_info[book.library_id] = true;
            }       
            //window.localStorage.setItem('kirja', JSON.stringify(data)); 
        });
    }

    $scope.searchAuthorPage = function(page) {
        $scope.flash.nobooks = false;

        Helmet.getBooksByAuthor($scope.author, page).then(function( data ) {
            var books = data.records;
            console.log(data);
            console.log(books);
            
            if ( books.length==0) {
                $scope.flash.nobooks = true;
                $scope.unsuccess = $scope.author;
            }

            _(books).each( function(book){
                book.all_authors = author_details(book);
            } );

            $scope.books = books;
            $scope.page = page;
            $scope.total_entries = data.total_entries;
            var number_of_pages = Math.ceil(data.total_entries / 12);
            $scope.pages = [];
            for( var i=1; i<=number_of_pages; i++ ){
                $scope.pages.push(i);
            }
            $scope.current = page;
        });       
    }
});

/*
 *
 *  EventsCtrl
 *
 */

app.controller('EventsCtrl', function ($scope, Events) {
    $scope.visible = false;
    $scope.wait = true; 

    Events.query().success( function(data) {
        $scope.events = data;
        $scope.wait = false;
    });
});

/*
 *
 *  RegisterSearchCtrl
 *
 */

app.controller('RegisterSearchCtrl', function($scope, $location) {
    $scope.click = function() {
        $location.path( "/register/"+$scope.eid );    
    }
});    

/*
 *
 *  RegisterCtrl
 *
 */

app.controller('RegisterCtrl', function($scope, $routeParams, Events, Registrations) {
    var slotIndex = function(slot) {
        for(var i in $scope.event.slots ) {
            var s = $scope.event.slots[i];
            if ( s.id==slot.id ) {
                return i;
            }
        }        
    }

    var mark = function(slot, name) {
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

    Events.by_identifier($routeParams.id).success( function(data) {
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
            Registrations.delete(indexAndId.id)
                .success(function (data, status, headers, config) {
                    unMark(slot, indexAndId.index );
                }).error(function (data, status, headers, config) {
                    console.log("unauthorized");
                });
        } else {
            var newRegistration = { 
                slot_id: slot.id, 
                name: $scope.name
            };      

            Registrations.save(newRegistration)
                .success(function (data, status, headers, config) {
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

app.controller('EventCtrl', function($scope, $routeParams, $location, $anchorScroll, Flash, Events, Slots) {
    var slotDates = function (slots) {
        var dates = [];

        slots.forEach( function(slot) {
            if ( dates.indexOf(slot.date)==-1 ) {
                dates.push(slot.date);
            }
        });

        return dates.sort();
    }

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
        Slots.delete(slot.id)
            .success(function (data, status, headers, config) {
                var index = indexOf(slot, $scope.event.slots);
                $scope.event.slots.splice(index, 1);
            }).error(function (data, status, headers, config) {
                console.log("unauthorized");
            });
    }

    $scope.newSlotForm = function () {
        $scope.newSlotFormVisible = true;
    }

    $scope.createSlot = function() {
        var postData = { 
            event_id: $routeParams.id, 
            text: $scope.newSlot.text,
            hh: $scope.newSlot.hh,
            mm: $scope.newSlot.mm,
            date: $scope.newSlot.date 
        };

        setDefaultValues();
        
        Slots.save(postData)
            .success(function (data, status, headers, config) {
                $scope.event.slots.push(data);
                $scope.dates = slotDates($scope.event.slots);
                $scope.dateSlotFormVisible = false;
                $scope.newSlotFormVisible = false;
            }).error(function (data, status, headers, config) {
                console.log("unauthorized");
            });
    }

    $scope.newSlotFor = function (date) {
        $scope.newSlot.date = date;
        $scope.visible = true;
    }

    $scope.scrollDown = Flash.goingDown;
    console.log("going down: "+$scope.scrollDown);
    $scope.flashSlot = Flash.flashSlot;

    setDefaultValues();

    Events.get($routeParams.id).success( function(data) {
        $scope.event = data;
        $scope.dates = slotDates($scope.event.slots);
        $scope.flash = Flash.show;
    }); 

});

/*
 *
 *  NewEventCtrl
 *
 */

app.controller('NewEventCtrl', function ($scope, $location, Flash, Events) {
    $scope.flashaa = function(){
        Flash.show = true;
    }

    $scope.create = function() {
        var newEvent = { 
            name:$scope.newEvent.name, 
            description:$scope.newEvent.description 
        }
        
        $scope.newEvent = {};

        Events.save(newEvent)
            .success(function (data, status, headers, config) {
                console.log(data);
                Flash.show = true;
                $location.path( "/events/"+data.id );
            }).error(function (data, status, headers, config) {
                console.log("unauthorized");
            });
    };

});


