var OAuth = require('./lib/oauth2'),
    OAuth2 = OAuth.OAuth2,
    routes = require('gupshup-utils');
    routes = routes.BotRoutes;
//Making a new instance of gupshup bot routes.
//Standard url will be https://www.gupshup.io/developer/bot/<botname>/auth/<channel_name>/oauth
//Please make sure you have added this url to your auth callback url of your respective app
var route = new routes();
(module.exports = oauth = function(creds) {
    if (!creds) {
        throw new Error("Creds are required.")
    }
    var _oauth = oauth.prototype;
    _oauth.execute = route.execute;
    _oauth.creds = creds;
    _oauth.route = creds.route||route;
    (function(creds) {
        _oauth.postCustomMsg = function(context, contextObj, msg, callback) {
            try {
                var params = "context=" + JSON.stringify(contextObj) + "&message=" + msg;
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'apikey': _oauth.creds.apikey
                };
                context.simplehttp.makePost("https://www.gupshup.io/sm/api/bot/" + _oauth.creds.botname + "/msg", params, headers, callback);
            } catch (err) {}
        };
        _oauth.getAccessToken = function(context, event, channel) {
            _oauth[channel].getOAuthAccessToken(event.params.code, { 'redirect_uri': _oauth.creds.channels[channel].callbackURL }, function(e, access_token, refresh_token, results) {
                if (e) {
                    context.console.log(e);
                    context.sendResponse("Error : " + e);
                } else if (results.error) {
                    context.console.log(results);
                    context.sendResponse("Results : " + JSON.stringify(results));
                } else {
                    //store to your roomlevel data
                    context.simpledb.doGet("room:" + event.params.state, function(_context, _event) {
                        if (_event.dbval) {
                            var data = _event.dbval;
                            try { data = JSON.parse(data); } catch (e) {
                                data = {};
                            }
                        }
                        data = data || {};
                        contextObj = data.contextObj || {};
                        data.auth = data.auth || {};
                        data.auth[channel] = access_token;
                        //Saving data to auth.faceboook for the first time and reassigning if already present.
                        context.simpledb.doPut('room:' + event.params.state, data, _oauth.creds.postCallback);
                    });
                }
            });
        }
        Object.keys(_oauth.creds.channels).map(function(channel, key) {
            _oauth[channel] = new OAuth2(_oauth.creds.channels[channel].clientID,
                _oauth.creds.channels[channel].clientSecret,
                _oauth.creds.channels[channel].baseUrl,
                _oauth.creds.channels[channel].authUrl,
                _oauth.creds.channels[channel].accessTokenUrl,
                null
            );
            console.log("Auth registered for "+channel)
            _oauth.route.on('GET', '/gupshup-oauth/'+channel+'/callback', function(context, event) {
                if (_oauth.creds.preCallback)
                    _oauth.creds.preCallback(context, event,channel, _oauth.getAccessToken)
                else {
                    _oauth.getAccessToken(context, event,channel)
                }
            });
            console.log("Route registered for "+channel)
        });
        _oauth.getSignedURL = function(channel,contextId){
            return _oauth[channel].getAuthorizeUrl({
                redirect_uri: _oauth.creds.channels[channel].callbackURL,
                scope: _oauth.creds.channels[channel].scope,
                state: contextId
            })
        }
    })(creds);
    return _oauth;
})
