// SignalR Helpers
// version 1.0.0 Build: 1
// © Databind, 2021
// https://github.com/databind10
//
// Released under GNU GENERAL PUBLIC LICENSE
// =====================================================================================================================

/**
 * Globals
 */
// store registrations to prevent multiples
var global_clientRegistration = [];

/**
 * Example: Starting the hub
 */
// Declare a proxy to reference the hub
var hub = $.connection.signalRHub;
$.connection.hub.url = "/uri/signalr";
$.connection.hub.logging = true;
$.connection.hub.start().done(function () {
    // Do Work
});

/**
 * Example: Sending an event
 */
$.connection.hub.start().done(function () {
  signalRHub.server.sendJSON('customNameHere', JSON.stringify({ 'key': 'value' }));
});

/**
 * Example: Receiving an event
 * Use this when available in multiple areas or even just 1 call
 */
if(!global_clientRegistration['id']) {
  global_clientRegistration['id'] = true;
  hub.on('customMethod', (json) => {
    var data = JSON.parse(json);
    $('#Dropdown').append(`<option value="${data.value}" selected>${data.label}</option>`);
  });
}

/**
 * Example: Receiving an event
 * Use this if it's the only call 
 */
if(!global_clientRegistration['id']) {
  global_clientRegistration['id'] = true;
  hub.client.customMethod = function(json) {
    var data = JSON.parse(json);
    $('#Dropdown').append(`<option value="${data.value}" selected>${data.label}</option>`);
  };
}
