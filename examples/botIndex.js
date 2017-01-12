// var oauth = require('./gupshupAuth.js')();
var authCreds = require('./config.json').oauth_creds;
var gupshupAuth = require('./myAuthImpl.js')(authCreds,authRoutes);
authCreds.preCallback = function(context,event,channel,done){
    //Do what you want to achieve with the code
    done(context,event,channel);
}
authCreds.postCallback = function(context,event,channel,done){
    //Do what you want to achieve with the code
    done(context,event,channel);
}
function MessageHandler(context, event) {
    context.simpledb.roomleveldata.lastMsgReceived = event.message;
    context.simpledb.roomleveldata.lastMsgReceivedOn = new Date().toString();
    if (event.message.toLowerCase() == "authcomplete") {
       context.sendResponse(JSON.stringify(context.simpledb.roomleveldata.auth));
    } else if (event.message.toLowerCase() == "auth") {
        //We will store this for sending messages in future
        context.simpledb.roomleveldata.contextObj = event.contextobj;
        var github_url = gupshupAuth.github.getAuthorizeUrl({
            redirect_uri: authCreds.github.callbackURL,
            scope: authCreds.github.scope,
            state: event.contextobj.contextid
        });
        var facebook_url = gupshupAuth.facebook.getAuthorizeUrl({
            redirect_uri: authCreds.facebook.callbackURL,
            scope: authCreds.facebook.scope,
            state: event.contextobj.contextid
        });
        var body = '<a href="' + authURL + '"> Get Code </a>';
        context.sendResponse(body);
        // var facebook_url = oauth.getSignedURL(context,event,'facebook');
        // var twitter_url = oauth.getSignedURL(context,event,'twitter');
        //You can use this json or directly print the authURL for auth
        var cbtn = {
            "type": "survey",
            "question": "Kindly authorize",
            "msgid": "3er45",
            "options": [
                {
                    "type": "url",
                    "title": "Authorize Facebook",
                    "url": facebook_url,
                    "webview_height_ratio": "full",
                    "messenger_extensions": true,
                },
                {
                    "type": "url",
                    "title": "Authorize Gihub",
                    "url": github_url
                },
                'Done'
            ]
        };
        // context.sendResponse(facebook_url);
        context.sendResponse(JSON.stringify(cbtn));
    } else {
        context.sendResponse('Please use one of following\nauthcomplete\nauth');
    }
}

function EventHandler(context, event) {
    context.console.log("Botleveldata:" + JSON.stringify(context.simpledb.botleveldata));
    if (!context.simpledb.botleveldata.numinstance)
        context.simpledb.botleveldata.numinstance = 0;
    numinstances = context.simpledb.botleveldata.numinstance + 1;
    context.simpledb.botleveldata.numinstance = numinstances;
    context.sendResponse("Thanks for adding me. You are:" + numinstances);
}

function HttpResponseHandler(context, event) {
    context.sendResponse('This is response from http \n'+JSON.stringify(event.getresp, null, '\t'));
}

function DbGetHandler(context, event) {
    context.sendResponse("testdbput keyword was last sent by:" + JSON.stringify(event.dbval));
}

function DbPutHandler(context, event) {
    context.sendResponse("testdbput keyword was last sent by:" + JSON.stringify(event.dbval));
}

function HttpEndpointHandler(context, event) {
    var path = event.request.path;
    //We filter only gupshup-oauth urls here
    if(path.match(/gupshup-oauth/g))
    {
        //Handling oauth specific urls
        gupshupAuth.execute(context,event);
    }else{
        context.sendResponse('This is response from http \n'+JSON.stringify(event, null, '\t'));
        //Put your custom url match patterns.
    }
}

function LocationHandler(context, event) {
    context.sendResponse("Got location");
}

exports.onMessage = MessageHandler;
exports.onEvent = EventHandler;
exports.onHttpResponse = HttpResponseHandler;
exports.onDbGet = DbGetHandler;
exports.onDbPut = DbPutHandler;
if(typeof LocationHandler == 'function'){exports.onLocation = LocationHandler;}
if(typeof  HttpEndpointHandler == 'function'){exports.onHttpEndpoint = HttpEndpointHandler;}
