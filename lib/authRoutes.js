var authCreds = require('../config.json').oauth_creds;
var OAuth = require('./oauth2'), OAuth2 = OAuth.OAuth2;
var http = require('http');
var routes = require('gupshup-utils').BotRoutes;
var querystring = require("querystring");
var route = new routes();
(module.exports = oauth = function(config) {
    var _oauth = oauth.prototype;
    _oauth.execute = route.execute;
    //Check if config is provided else load from config.json;
    var creds = (config||authCreds);
    _oauth.creds = creds;
    (function(creds){
        /***
         * Registering Oauth for Facebook
         ***/

        route.on('GET','/gupshup-oauth/facebook/login',function(context,event){
            var authurl = "https://www.facebook.com/v2.8/dialog/oauth"
                +"?client_id="+creds.facebookAuth.clientID
                +"&redirect_uri="+creds.facebookAuth.callbackURL
                +"&state="+event.params.state
                +"&scopes="+(creds.facebookAuth.scope||'email, user')
                +"&response_type=token";
            context.console.log(authurl);
            context.sendResponse("<meta http-equiv='refresh' content=\"0; URL='"+authurl+"'\"/>","text/html");
        });
        route.on('GET','/gupshup-oauth/facebook/callback',function(context,event){
            /**Hacks for facebook **/
            // context.sendResponse("Yes")
            //Your code will appear here
            // context.sendResponse(event.params);
            
            //Get access token from graph api
            _oauth.facebookOauth.getOAuthAccessToken(
                event.params.code,
                {'redirect_uri': authCreds.facebook.callbackURL},
                function (e, access_token, refresh_token, results){
                    if (e) {
                        console.log(e);
                        context.sendResponse("Error : "+e);
                    } else if (results.error) {
                        console.log(results);
                        context.sendResponse("Results : "+JSON.stringify(results));
                    }
                    else {
                        console.log('Obtained access_token: ', access_token);
                        // context.sendResponse("AccessToken : "+access_token);
                        //store to your roomlevel data
                        context.simpledb.doGet("room:"+event.params.state, function(_context, _event) {
                            if (_event.dbval) {
                                var data = _event.dbval;
                                try { data = JSON.parse(data); } catch (e) {
                                    data = {};
                                }
                            }
                            data = data || {};
                            contextObj = data.contextObj || {};
                            data.auth = data.auth || {};
                            data.auth.facebook = access_token;
                            //Saving data to auth.faceboook for the first time and reassigning if already present.
                            context.simpledb.doPut('room:'+event.params.state, data);
                            _oauth.postCustomMsg(context,contextObj,"Auth Completed successfully",function(res,data){
                                context.sendResponse(JSON.stringify({"res":res,"data":data}));
                            });
                        });
                    }
            });
        });
        route.on('POST','/gupshup-oauth/facebook/callback',function(context,event){
            // context.sendResponse("SUCCESS : Token registered for contextId : "+event.params.state);
            
        });
        _oauth.githubOauth = new OAuth2(authCreds.github.clientID,
            authCreds.github.clientSecret,
            authCreds.github.baseUrl,
            'login/oauth/authorize',
            'login/oauth/access_token',
            null
        )
        _oauth.facebookOauth = new OAuth2(authCreds.facebook.clientID,
            authCreds.facebook.clientSecret,
            authCreds.facebook.baseUrl,
            'https://www.facebook.com/dialog/oauth',
            'https://graph.facebook.com/oauth/access_token',
            null
        );
        console.log('Oauth init completed');
    })(creds);
    _oauth.postCustomMsg = function(context,contextObj,msg,callback){
        context.console.log(">>>>>>>>>>"+JSON.stringify(contextObj))
        try{
            var params = "context="+JSON.stringify(contextObj)+"&message="+msg;
            var headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey':_oauth.creds.apikey
            };
            context.simplehttp.makePost("https://dev-api.gupshup.io/sm/api/bot/"+creds.botname+"/msg",params,headers,callback);
        }catch(err){
        }
    };
    _oauth.getSignedURL = function(context,event,channel){
        context.simpledb.roomleveldata.contextObj = event.contextobj;
        //Loosing track of user context from here, so saving contextObj
        var state = encodeURIComponent(event.contextobj.contextid)+"_"+new Date().getTime();
        return "https://dev-smapi.gupshup.io/developer/bot/"+creds.botname+"/gupshup-oauth/"+channel+"/login?state="+state;
    };
    _oauth.registerChannel = function(context,event,channel){
        var body = {"client_id":_oauth.creds.facebookAuth.clientID,
            "client_secret":_oauth.creds.facebookAuth.clientSecret,
            "grant_type":"client_credentials"
        };

        console.log("test"+querystring.stringify(body));
        context.simplehttp.makePost(
            "https://graph.facebook.com/oauth/access_token",
            querystring.stringify(body),
            null,
            function(_context, _event) {
                var result = _event.getresp;
                console.log(">>>>>>>",result);
                if (result) {
                    creds.accessToken = result.accessToken;
                    if (_oauth._tokenExpiry)
                        creds.tokenRegistrationTime = new Date().getTime();
                    context.simpledb.roomleveldata.authCreds = creds;
                    return creds;
                }
            }
        );
    }
    return _oauth;
})