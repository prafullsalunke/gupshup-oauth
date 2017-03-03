# gupshup-oauth
This is a sample oauth implementation for the bots platform on gupshup.io dev-box ide

## Installation
npm install gupshup-oauth

## Usage
**1. Create a config.json with following credentials**
```
var config = {
    "oauth_creds": {
        "botname": "<gupshup_botname>",
        "apikey": "<gupshup_apikey>",
        "channels": {
            "github": {
                /* Callback url here is gupshup url for github channel. 
                ** Kindly enter your botname in <gupshup_botname. 
                ** You can also change it to your own callback url but you will have to handle auth on your server instead
                **/
                "callbackURL": "https://www.gupshup.io/developer/bot/<gupshup_botname>/gupshup-oauth/github/callback",
                "baseUrl": "https://github.com/",
                "authUrl": "login/oauth/authorize",
                "accessTokenUrl": "login/oauth/access_token",
                "clientSecret": "<client_secret_key>",
                "clientID": "<client_id>",
                "scope": "first_name,last_name,email"
            },
            "facebook": {
                /* Callback url here is gupshup url for facebook channel. 
                ** Kindly enter your botname in <gupshup_botname. 
                ** You can also change it to your own callback url but you will have to handle auth on your server instead
                **/
                "callbackURL": "https://www.gupshup.io/developer/bot/<gupshup_botname>/gupshup-oauth/facebook/callback",
                "baseUrl": "",
                "authUrl": "https://www.facebook.com/v2.8/dialog/oauth",
                "accessTokenUrl": "https://graph.facebook.com/oauth/access_token",
                "clientSecret": "<client_secret_key>",
                "clientID": "<client_id>",
                "scope": "public_profile email"
            }
        }
    }
}
```
If you are using gupshup callback url. Kindly make sure that the structure is as follows.
```
https://www.gupshup.io/developer/bot/<gupshup_botname>/gupshup-oauth/<channel_name>/callback
where channel_name is the key for the channels Object, eg.facebook,github,twitter or your own oauth.
```

**2. Use these creds inside your index.js file (You can refer to the botIndex.js in examples for better understanding.)**
```
//Fetch config
var authCreds = require('./config.json').oauth_creds;
//Register new oauth instance with your auth config
var gupshupAuth = require('gupshup-oauth')(authCreds);
```
**3. You need to specify any handling that you wish to do before and after the auth is finished.**
```
//This will be called on auth request completion,
// the oauth channel will share code to fetch auth token
authCreds.preCallback = function(context, event, channel, done) {
        //Do what you want to achieve with the code
        done(context, event, channel);
}

//This will be called after we have saved creds to roomlevel data,
// You will still have control over the code received.
authCreds.postCallback = function(context, event, channel, done) {
    //Do what you want to achieve with the code
    done(context, event, channel);
}
```
**4. Fetch the signend_link to share it with your users. This needs to be done in the MessageHandler section**
```
var facebook_signed_url = gupshupAuth.getSignedURL('facebook', event.contextobj.contextid);
var facebook_signed_url = gupshupAuth.getSignedURL('github', event.contextobj.contextid);
```
The structure is.
```
gupshupAuth.getSignedURL(<channel_name>, <state>);
```
> **Kindly note that state is required here and channel_name could be only from the auth creds defined in the config.json**

**5. The last and the most important step where you have to filter all gupshup-oauth http responses in the HttpEndpointHandler section**
```
if (path.match(/gupshup-oauth/g)) {
    //Handling oauth specific urls
    gupshupAuth.execute(context, event);
} else {
    context.sendResponse('This is response from http \n' + JSON.stringify(event, null, '\t'));
    //Put your custom url match patterns.
}
```
#Congratulations!!! thats all.

You can refer to [botIndex.js](https://github.com/prafullsalunke/gupshup-oauth/blob/master/examples/botIndex.js) for a better understanding of the above mentioned steps.

### Kindly share your feedback, we will be very pleased to help you. 
Visit [gupshup.io](http://www.gupshup.io/developer/) to create your bots and use them in your code.
