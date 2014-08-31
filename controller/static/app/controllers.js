'use strict';

angular.module('shipyard.controllers', ['ngCookies'])
        .controller('HeaderController', function($http, $scope, AuthToken) {
            $scope.template = 'templates/header.html';
            $scope.username = AuthToken.getUsername();
            $http.defaults.headers.common['X-Access-Token'] = AuthToken.get();
        })
        .controller('MenuController', function($scope, $location, $cookieStore, AuthToken) {
            $scope.template = 'templates/menu.html';
            $scope.isActive = function(path){
                if ($location.path().substr(0, path.length) == path) {
                    return true
                }
                return false
            }
            $scope.isLoggedIn = AuthToken.isLoggedIn();
        })
        .controller('LoginController', function($scope, $cookieStore, $window, flash, Login, AuthToken) {
            $scope.template = 'templates/login.html';
            $scope.login = function() {
                Login.login({username: $scope.username, password: $scope.password}).$promise.then(function(data){
                    AuthToken.save($scope.username, data.auth_token);
                    $window.location.href = '/#/dashboard';
                    $window.location.reload();
                }, function() {
                    flash.error = 'invalid username/password';
                });
            }
        })
        .controller('LogoutController', function($scope, $window, AuthToken) {
            AuthToken.delete();
            $window.location.href = '/#/login';
            $window.location.reload();
        })
        .controller('DashboardController', function($http, $scope, Events, ClusterInfo, AuthToken) {
            $scope.template = 'templates/dashboard.html';
            Events.query(function(data){
                $scope.events = data;
            });
            $scope.showX = function(){
                return function(d){
                    return d.key;
                };
            };
            $scope.showY = function(){
                return function(d){
                    return d.y;
                };
            };
            ClusterInfo.query(function(data){
                $scope.clusterInfo = data;
                $scope.clusterCpuData = [
                    { key: "Free", y: data.cpus - data.reserved_cpus },
                    { key: "Reserved", y: data.reserved_cpus }
                ];
                $scope.clusterMemoryData = [
                    { key: "Free", y: data.memory - data.reserved_memory },
                    { key: "Reserved", y: data.reserved_memory }
                ];
            });
        })
        .controller('ContainersController', function($scope, Containers) {
            $scope.template = 'templates/containers.html';
            Containers.query(function(data){
                $scope.containers = data;
            });
        })
        .controller('DeployController', function($scope, $location, Engines, Container) {
            var labels = [];
            var types = [
                "service",
                "host",
                "unique"
            ];
            $scope.cpus = 0.1;
            $scope.memory = 256;
            $scope.environment = "";
            $scope.hostname = "";
            $scope.count = 1;
            $scope.args = "";
            $scope.types = types;
            $scope.selectLabel = function(label) {
                $scope.selectedLabel = label;
            };
            $scope.selectType = function(type) {
                $scope.selectedType = type;
            };
            $scope.init = function() {
                $('.ui.dropdown').dropdown();
            };
            Engines.query(function(engines){
                angular.forEach(engines, function(e) {
                    angular.forEach(e.engine.labels, function(l){
                        if (labels.indexOf(l) == -1) {
                            this.push(l);
                        }
                    }, labels);
                });
                $scope.labels = labels;
            });
            $scope.deploy = function() {
                var valid = $(".ui.form").form('validate form');
                if (!valid) {
                    return false;
                }
                // format environment
                var envParts = $scope.environment.split(" ");
                var environment = {};
                var args = $scope.args.split(" ");
                var labels = [$scope.selectedLabel];
                for (var i=0; i<envParts.length; i++) {
                    var env = envParts[i].split("=");
                    environment[env[0]] = env[1];
                }
                var params = {
                    name: $scope.name,
                    cpus: parseFloat($scope.cpus),
                    memory: parseFloat($scope.memory),
                    environment: environment,
                    hostname: $scope.hostname,
                    type: $scope.selectedType,
                    args: args,
                    labels: labels,
                    publish: true
                };
                Container.save(params).$promise.then(function(c){
                    $location.path("/containers");
                }, function(err){
                    console.log('err');
                    $scope.error = err.data;
                    return false;
                });
            }
        })
        .controller('ContainerDetailsController', function($scope, $location, $routeParams, flash, Container) {
            $scope.template = 'templates/container_details.html';
            $scope.showX = function(){
                return function(d){
                    return d.key;
                };
            };
            $scope.showRemoveContainerDialog = function() {
                $('.basic.modal')
                    .modal('show');
            };
            $scope.destroyContainer = function() {
                Container.destroy({id: $routeParams.id}).$promise.then(function() {
                    // we must remove the modal or it will come back
                    // the next time the modal is shown
                    $('.basic.modal').remove();
                    $location.path("/containers");
                }, function(err) {
                    flash.error = 'error destroying container: ' + err.data;
                });
            };
            var portLinks = [];
            Container.query({id: $routeParams.id}, function(data){
                $scope.container = data;
                // build port links
                $scope.tooltipFunction = function(){
                    return function(key, x, y, e, graph) {
                        return "<div class='ui block small header'>Reserved</div>" + '<p>' + y + '</p>';
                    }
                };
                angular.forEach(data.ports, function(p) {
                    var h = document.createElement('a');
                    h.href = data.engine.addr;
                    var l = {};
                    l.protocol = p.proto;
                    l.container_port = p.container_port;
                    l.link = h.protocol + '//' + h.hostname + ':' + p.port;
                    this.push(l);
                }, portLinks);
                $scope.portLinks = portLinks;
                $scope.predicate = 'container_port';
                $scope.cpuMax = data.engine.cpus;
                $scope.memoryMax = data.engine.memory;
                $scope.containerCpuData = [
                    {
                        "key": "CPU",
                        "values": [ [$scope.container.image.cpus, $scope.container.image.cpus] ]
                    }
                ];
                $scope.containerMemoryData = [
                    {
                        "key": "Memory",
                        "values": [ [$scope.container.image.memory, $scope.container.image.memory] ]
                    }
                ];
            });
        })
        .controller('EnginesController', function($scope, Engines) {
            $scope.template = 'templates/engines.html';
            Engines.query(function(data){
                $scope.engines = data;
            });
        })
        .controller('EventsController', function($scope, Events) {
            $scope.template = 'templates/events.html';
            Events.query(function(data){
                $scope.events = data;
            });
        })


$(function(){
    $('.message .close').on('click', function() {
          $(this).closest('.message').fadeOut();
    });
});
