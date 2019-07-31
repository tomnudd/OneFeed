// DU z----2, April 2019
// node.js app to combine feeds of multiple social media platform
const express = require("express");
const app = express();
const session = require("express-session");
const fetch = require("node-fetch");

// need to manipulate headers for api requests
global.Headers = fetch.Headers;
const Headers = global.Headers;

const oauthSignature = require("oauth-signature");
const path = require("path");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const InstagramStrategy = require("passport-instagram").Strategy;
const YoutubeV3Strategy = require("passport-youtube-v3").Strategy;
const TumblrStrategy = require("passport-tumblr").Strategy;

// twitter app keys
// these keys do not provide access to an account
// instead, user keys generated upon login
const TWITTER_CONSUMER_KEY = "gYmlzp24LussWw6UvxEIedlPO";
const TWITTER_CONSUMER_SECRET = "IFmUdX3UEUBFVp3K6DADdAj6xPf9nbAUKG2oKoJK9bpTI5nNbg";
const twitCallback = "http://127.0.0.1:8090/twitter/callback";

// instagram app keys
// these keys do not provide access to an account
// instead, user keys generated upon login
const INSTAGRAM_ID = "24b0fddc7a4f4f9b9666f962fb7a4f72";
const INSTAGRAM_SECRET = "48c03eccbf1d405e8921aac8882da791";
const instaCallback = "http://127.0.0.1:8090/instagram/callback";

// youtube app keys
// these keys do not provide access to an account
// instead, user keys generated upon login
const YOUTUBE_ID = "107329950182-i2d3d0scpsjoh0jbgrbt3tmaul1a3v4b.apps.googleusercontent.com";
const YOUTUBE_SECRET = "CA7rFYZvtwZVxybQ2p6szmLQ";
const youtubeCallback = "http://127.0.0.1:8090/youtube/callback";

// reddit app keys
// do not provide access to any account
const REDDIT_KEY = "pp0unp2tp97NEA";
const REDDIT_SECRET = "rK2ONaNR1wxrpzLAB0cIqJg56VQ";

// tumblr app keys
// these keys do not provide access to an account
// instead, user keys generated upon login
const TUMBLR_KEY = "Tgvi1wtY4n22z3h3HLhmK2wXAbkPHICYtfWTXkqtazaPRkeqkC";
const TUMBLR_SECRET = "vZwTZM1orOe8ABjyglZTcAMnMliEvWIg4AVIv4wXk2M5vobjXI";
const tumblrCallback = "http://127.0.0.1:8090/tumblr/callback";

// for post requests
const bodyParser = require("body-parser");

// twitter strategy
// hacky method of combining multiple strategies into the request
// rather than the one usually allowed by passport
passport.use(new TwitterStrategy({
	name: "twitter",
	consumerKey: TWITTER_CONSUMER_KEY,
	consumerSecret: TWITTER_CONSUMER_SECRET,
	callbackURL: twitCallback,
	passReqToCallback: true
},
function (req, token, tokenSecret, profile, callback) {
	if (!req.user) {
		req.user = {};
	}
	req.user.twitter = profile;
	req.user.twitter.token = token;
	req.user.twitter.tokenSecret = tokenSecret;
	// return callback function with user obj.
	return callback(null, req.user);
})
);

// instagram strategy
passport.use(new InstagramStrategy({
	name: "instagram",
	clientID: INSTAGRAM_ID,
	clientSecret: INSTAGRAM_SECRET,
	callbackURL: instaCallback,
	scope: "public_content",
	passReqToCallback: true
},
function (req, accessToken, refreshToken, profile, callback) {
	if (!req.user) {
		req.user = {};
	}
	req.user.instagram = profile;
	req.user.instagram.accessToken = accessToken;
	// req.user.instagram.refreshToken = refreshToken;
	// refresh token is not in use per API docs
	return callback(null, req.user);
})
);

// youtube strategy
passport.use(new YoutubeV3Strategy({
	name: "youtube",
	clientID: YOUTUBE_ID,
	clientSecret: YOUTUBE_SECRET,
	callbackURL: youtubeCallback,
	scope: ["https://www.googleapis.com/auth/youtube.readonly"],
	passReqToCallback: true
},
function (req, accessToken, refreshToken, profile, callback) {
	if (!req.user) {
		req.user = {};
	}
	req.user.youtube = profile;
	req.user.youtube.accessToken = accessToken;
	req.user.youtube.refreshToken = refreshToken;

	return callback(null, req.user);
})
);

// tumblr strategy
passport.use(new TumblrStrategy({
	// oauth params required to log a user i
	name: "tumblr",
	requestTokenURL: "https://www.tumblr.com/oauth/request_token",
	accessTokenURL: "https://www.tumblr.com/oauth/access_token",
	userAuthorizationURL: "https://www.tumblr.com/oauth/authorize",
	consumerKey: TUMBLR_KEY,
	consumerSecret: TUMBLR_SECRET,
	callbackURL: tumblrCallback,
	// req must be signed based on all other params & req url/method
	signatureMethod: "HMAC-SHA1",
	passReqToCallback: true
},
function (req, token, tokenSecret, profile, callback) {
	if (!req.user) {
		req.user = {};
	}
	req.user.tumblr = profile;
	req.user.tumblr.token = token;
	req.user.tumblr.tokenSecret = tokenSecret;
	return callback(null, req.user);
})
);

// session details including random secret
app.use(session({
	name: "OneFeed JSESSION",
	secret: "g6a7HAUI^jdyHsu*shAYUa*SADO2d82%HAaaPiN3appLEJu$c3u9js*M0^SsB",
	resave: false,
	saveUninitialized: true
}));

// both serialize and deserialize the user; typically would only deserialize by finding via user id
// however, as there is no database of user ids associated with twitter and IG accounts,
// need to serialize and deserialize user profiles
passport.serializeUser(function (user, callback) {
	callback(null, user);
});
passport.deserializeUser(function (obj, callback) {
	callback(null, obj);
});

// initialise passport session
app.use(passport.initialize());
app.use(passport.session());
// post reqs
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// static html content in client folder
app.use(express.static(path.join(__dirname, "client")));

// application bearer token for the app (not user-specific)
// expires every hour, so gets refreshed according to redditTokenExpired
const redditToken = {};

// obtain reddit bearer token
// use when expired
app.get("/redditToken", async function (req, res) {
	try {
		const resp = await fetch("https://www.reddit.com/api/v1/access_token", {
			method: "POST",
			headers: new Headers({
				"Authorization": "Basic " + Buffer.from(REDDIT_KEY + ":" + REDDIT_SECRET).toString("base64"), // base64-encoded key:secret
				"User-Agent": "OneFeed online",
				"Content-Type": "application/x-www-form-urlencoded" // reddit only accepts x-www-form-urlencoded requests, but returns json
			}),
			body: "grant_type=client_credentials&username=&password=" // application-only so username and password fields (which must be specified) are empty
		});
		if (resp && resp.ok) { // resp.ok
			redditToken.token = await resp.json();
			if (!redditToken.token.access_token || !(redditToken.token.token_type == "bearer") || !redditToken.token.expires_in || !redditToken.token.scope) {
				res.status(400);
			}
			const now = new Date();
			// expiry time (multiply by 1000 as in ms), converted to Date() format for storage
			redditToken.expiry = new Date(now.getTime() + redditToken.token.expires_in * 1000);
			req.session.redditToken = redditToken;
			// send response saying that we have the token
			res.json({ "token": true });
		} else {
			// no token received, send resp saying this
			res.json({ "token": false });
		}
	} catch(error) {
		res.status(400);
		res.json({message:"Error"});
	}
});

// check whether the bearer token has expired by comparing the current date
// with the date in ...redditToken.expiry
// use in index.js to request a new token if expired
app.get("/redditTokenExpired", async function (req, res) {
	if (process.env.NODE_ENV == "test") {
		if (req.query.auth == "true") {
			req.session.redditToken = {};
			const dat = new Date();
			if (req.query.expired == "false") {
				dat.setDate(dat.getDate() + 1);
				req.session.redditToken.expiry = dat;
			} else {
				dat.setDate(dat.getDate() - 1);
				req.session.redditToken.expiry = dat;
			}
		}
	}
	// check if the reddit token exists with an expiry date attached
	if (req.session && req.session.redditToken && req.session.redditToken.expiry) {
		// compare current date to date of token expiry
		const date1 = new Date(req.session.redditToken.expiry);
		const date2 = new Date();
		if (date1.getTime() >= date2.getTime()) {
			res.json({expired: false});
		} else {
			res.json({expired: true});
		}
	} else {
		// not logged in in the first place
		res.json({expired: true});
	}
});

// request and extract subreddit content
// takes params "subreddit" and "after"
// "after" is the name of the last post already retrieved (t3_...)
// "subreddit" is the name of the subreddit to get posts from
app.get("/reddit", async function (req, res) {
	if (req.query.subreddit && req.query.subreddit.length > 0) {
		const subreddit = req.query.subreddit;
		const after = req.query.after || null;

		try {
			const response = await fetch("https://reddit.com/r/" + subreddit + "/top/.json?limit=20&after=" + after, {
				method: "GET"
			});
			// check resp status
			if (response && response.ok) {
				const body = await response.json();
				const posts = await body.data.children;
				// reddit returns an array of posts [] if the subreddit is invalid/does not exist
				// check for this with length
				if (Array.isArray(posts) && posts.length > 0) {
					res.send(posts);
				} else {
					res.status(400);
					res.json({message:"Invalid subreddit"});
				}
			} else {
				res.status(400);
				// send "respose" from api as res
				res.json({message:"Error: " + response});
			}
		} catch(error) {
			res.status(400);
			res.json({message:"Error: " + error});
		}
	} else {
		res.status(400);
		res.json({message:"Error: no subreddit provided"});
	}
});

// function to generate a new reddit token when required
const newToken = async function (req, res) {
	try {
		const resp = await fetch("http://127.0.0.1:8090/redditToken");
		if (!resp.ok) {
			throw new Error("Error: " + resp.code);
		} else {
			const rj = await resp.json();
			const tok = rj.token;
			if (tok != true) {
				res.status(400);
				res.json({message:"Error"});
			}
		}
	} catch (error) {
		res.status(400);
		res.json({message:"Error: " + error});
	}
};

app.get("/redditSubreddits", async function (req, res) {
	if (process.env.NODE_ENV == "test") {
		req.session.redditToken = {token:{access_token:"token"}};
	} else {
		// check if application bearer token has expired
		if (req.session && req.session.redditToken && req.session.redditToken.expiry) {
			const date1 = new Date(req.session.redditToken.expiry);
			const date2 = new Date();
			if (date1.getTime() < date2.getTime()) {
				// generate a new token
				newToken();
			}
		} else {
			// generate a new token if one does not exist in the user's session
			newToken();
		}
	}

	// need a term to search
	if (!req.query.search) {
		res.status(400);
		res.json({message:"No subreddit provided"});
	} else {
		// if there is a query, ensure this is a string
		const searchTerm = req.query.search;
		if (searchTerm.length > 50) {
			// reddit only accepts query strings of length 50 chars or less
			res.status(400);
			res.json({message:"Query string too long"});
		} else if (searchTerm.length < 1) {
			// catches random errors
			res.status(400);
			res.json({message:"Query string too short"});
		} else {
			// provide application only bearer token when making request
			const token = req.session.redditToken.token.access_token;
			try {
				const response = await fetch("https://oauth.reddit.com/api/search_reddit_names?query=" + searchTerm, {
					method: "GET",
					headers: new Headers({
						"Authorization": "Bearer " + token,
						"User-Agent": "OneFeed online",
						"Content-Type": "application/x-www-form-urlencoded"
					})
				});
				if (response && response.ok) {
					const body = await response.json();
					res.send(body.names);
				} else {
					res.json({message:"Error: " + response.code});
				}
			} catch(error) {
				res.status(400);
				res.json({message:"Error: " + error});
			}
		}
	}
});

// check whether user is logged into twitter
// basically the same as isAuthenticated but allows for my division of req.user into many different objects for different platforms
app.get("/twitter/isLoggedIn", async function (req, res) {
	if (process.env.NODE_ENV == "test") {
		if (req.query.auth == "true") {
			req.user = {};
			req.user.twitter = {};
			req.user.twitter.username = "testUser";
			req.user.twitter.displayName = "testDisplayName";
			req.user.twitter.accessToken = "MOCKACCESSTOKEN";
			req.user.twitter.refreshToken = "MOCKREFRESHTOKEN";
			req.user.twitter.token = "MOCKTOKEN";
			req.user.twitter.tokenSecret = "MOCKTOKENSECRET";
		}
	}
	// check if the user has a twitter session

	if (req.user && req.user.twitter && req.user.twitter.username) {
		res.json({ "auth": true });
	} else {
		res.json({ "auth": false });
	}
});

// handle passport login to twitter
app.get("/twitter/login", passport.authenticate("twitter"));

app.get("/twitter/callback", passport.authenticate("twitter", {
	failureRedirect: "/"
}),
async function (req, res) {
	res.redirect("/");
});

// oauth_nonce requires a random, unique string of 32 chars
// call this function to generate a new one every time a timeline is requested
function nonce (len) {
	let res = "";
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charsLen = chars.length;
	for (let i = 0; i < len; i++) {
		res += chars.charAt(Math.floor(Math.random() * charsLen));
	}
	return res;
}

// GET the user's twitter timeline
app.get("/twitter/timeline", async function (req, res) {
	if (process.env.NODE_ENV == "test") {
		req.user = {};
		req.user.twitter = {};
		req.user.twitter.token = "token";
		req.user.twitter.tokenSecret = "token";
	}

	// check if logged in
	if (req.user && req.user.twitter && req.user.twitter.token && req.user.twitter.tokenSecret) {
		// oauth requires distinct 32-bit string for each request
		const oauth_nonce = nonce(32);
		// unix epoch time
		const oauth_timestamp = Math.floor(new Date().getTime() / 1000);
		const method = "GET";
		const url = "https://api.twitter.com/1.1/statuses/home_timeline.json";
		// need to generate an oauth signature based on all other parameters (and url/method)/header items
		const params = {
			oauth_consumer_key: TWITTER_CONSUMER_KEY,
			oauth_token: req.user.twitter.token,
			oauth_nonce: oauth_nonce,
			oauth_timestamp: oauth_timestamp,
			oauth_signature_method: "HMAC-SHA1",
			oauth_version: "1.0"
		};
		const signature = oauthSignature.generate(method, url, params, TWITTER_CONSUMER_SECRET, req.user.twitter.tokenSecret);

		try {
			const response = await fetch("https://api.twitter.com/1.1/statuses/home_timeline.json", {
				method: method,
				// construct header for oauth request
				headers: new Headers({
					"Authorization": "OAuth " + "oauth_consumer_key=\"" + encodeURIComponent(TWITTER_CONSUMER_KEY) + "\", oauth_token=\"" + encodeURIComponent(req.user.twitter.token) + "\",\
					oauth_nonce=\"" + oauth_nonce + "\", oauth_timestamp=\"" + oauth_timestamp + "\", oauth_signature_method=\"HMAC-SHA1\", oauth_version=\"1.0\", oauth_signature=\"" + signature + "\"",
					"User-Agent": "OneFeed online",
					"Content-Type": "application/x-www-form-urlencoded"
				})
			});
			if (response && response.ok) {
				const body = await response.json();
				res.send(body);
			} else {
				res.json({message:"Error: " + response.code});
			}
		} catch(error) {
			res.status(400);
			res.json({message:"Error: " + error});
		}
	} else {
		res.status(403);
		res.json({message:"Not logged in"});
	}
});

// check whether user is logged into youtube
app.get("/youtube/isLoggedIn", function (req, res) {
	if (process.env.NODE_ENV == "test") {
		if (req.query.auth == "true") {
			req.user = {};
			req.user.youtube = {};
			req.user.youtube.username = "testUser";
			req.user.youtube.displayName = "testDisplayName";
			req.user.youtube.accessToken = "MOCKACCESSTOKEN";
			req.user.youtube.refreshToken = "MOCKREFRESHTOKEN";
			req.user.youtube.token = "MOCKTOKEN";
			req.user.youtube.tokenSecret = "MOCKTOKENSECRET";
		}
	}
	if (req.user && req.user.youtube && req.user.youtube.displayName) {
		res.json({ "auth": true });
	} else {
		res.json({ "auth": false });
	}
});

// handle passport login to youtube
app.get("/youtube/login", passport.authenticate("youtube"));

app.get("/youtube/callback", passport.authenticate("youtube", {
	failureRedirect: "/"
}),
async function (req, res) {
	res.redirect("/");
});

// method to get an array of popular videos for youtube
app.get("/youtube/popular", async function (req, res) {
	if (process.env.NODE_ENV == "test") {
		req.user = {};
		req.user.youtube = {};
		req.user.youtube.accessToken = "token";
	}

	// check if logged in
	if (req.user && req.user.youtube && req.user.youtube.accessToken) {
		const token = req.user.youtube.accessToken;
		try {
			const response = await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet&maxResults=20&chart=mostPopular",
				{ method: "GET",
					headers: new Headers({
						"Authorization": "Bearer " + token,
						"User-Agent": "OneFeed online",
						"Content-Type": "application/x-www-form-urlencoded"
					})
				});
			// get the array of items
			const bod = await response.json();
			const items = await bod.items;
			res.send(items);
		} catch(error) {
			res.status(400);
			res.json({message:"Error: " + error});
		}
	} else {
		res.status(403);
		res.json({message:"Not logged in"});
	}
});

// check whether user is logged into tumblr
app.get("/tumblr/isLoggedIn", function (req, res) {
	// mocking!
	if (process.env.NODE_ENV == "test") {
		if (req.query.auth == "true") {
			req.user = {};
			req.user.tumblr = {};
			req.user.tumblr.username = "testUser";
			req.user.tumblr.displayName = "testDisplayName";
			req.user.tumblr.accessToken = "MOCKACCESSTOKEN";
			req.user.tumblr.refreshToken = "MOCKREFRESHTOKEN";
			req.user.tumblr.token = "MOCKTOKEN";
			req.user.tumblr.tokenSecret = "MOCKTOKENSECRET";
		}
	}
	if (req.user && req.user.tumblr && req.user.tumblr.username) {
		res.json({ "auth": true });
	} else {
		res.json({ "auth": false });
	}
});

// handle passport login to tumblr
app.get("/tumblr/login", passport.authenticate("tumblr"));

app.get("/tumblr/callback", passport.authenticate("tumblr", {
	failureRedirect: "/"
}),
async function (req, res) {
	res.redirect("/");
});

app.get("/tumblr/dashboard", async function (req, res) {
	// check if logged in
	if (req.user && req.user.tumblr && req.user.tumblr.token && req.user.tumblr.tokenSecret) {
		// oauth requires distinct 32-bit string for each request
		const oauth_nonce = nonce(13);
		// unix epoch time
		const oauth_timestamp = Math.floor(new Date().getTime() / 1000);
		const method = "GET";
		const tumblrUrl = "https://api.tumblr.com/v2/user/dashboard";
		// need to generate an oauth signature based on all other parameters (and url/method)/header items
		const tumblrParams = {
			oauth_consumer_key: TUMBLR_KEY,
			oauth_token: req.user.tumblr.token,
			oauth_nonce: oauth_nonce,
			oauth_timestamp: oauth_timestamp,
			oauth_signature_method: "HMAC-SHA1",
			oauth_version: "1.0"
		};
		const signature = oauthSignature.generate(method, tumblrUrl, tumblrParams, TUMBLR_SECRET, req.user.tumblr.tokenSecret);
		const header = "OAuth oauth_consumer_key=\"" + encodeURIComponent(TUMBLR_KEY) + "\", oauth_token=\"" + encodeURIComponent(req.user.tumblr.token) + "\", \
    oauth_nonce=\"" + oauth_nonce + "\", oauth_timestamp=\"" + oauth_timestamp + "\", oauth_signature_method=\"HMAC-SHA1\", oauth_version=\"1.0\", oauth_signature=\"" + signature + "\"";
		try {
			const response = await fetch("https://api.tumblr.com/v2/user/dashboard", {
				method: method,
				// construct header for oauth request
				headers: new Headers({
					"Authorization": header,
					"User-Agent": "OneFeed online",
					"Content-Type": "application/x-www-form-urlencoded"
				})
			});
			if (response.ok) {
				const rj = await response.json();
				const posts = await rj.response.posts;
				res.send(posts);
			} else {
				throw new Error("Error: " + response.code);
			}
		} catch(error) {
			res.status(400);
			res.json({message:"Error: " + error});
		}
	} else {
		res.status(403);
		res.json({message:"Not logged in"});
	}
});

// check whether user is logged into instagram
app.get("/instagram/isLoggedIn", function (req, res) {
	// mocking!
	if (process.env.NODE_ENV == "test") {
		if (req.query.auth == "true") {
			req.user = {};
			req.user.instagram = {};
			req.user.instagram.username = "testUser";
			req.user.instagram.displayName = "testDisplayName";
			req.user.instagram.accessToken = "MOCKACCESSTOKEN";
			req.user.instagram.refreshToken = "MOCKREFRESHTOKEN";
			req.user.instagram.token = "MOCKTOKEN";
			req.user.instagram.tokenSecret = "MOCKTOKENSECRET";
		}
	}
	if (req.user && req.user.instagram && req.user.instagram.username) {
		res.json({ "auth": true });
	} else {
		res.json({ "auth": false });
	}
});

// handle passport login to instagram
app.get("/instagram/login", passport.authenticate("instagram"));

app.get("/instagram/callback", passport.authenticate("instagram", {
	scope: ["public_content"],
	failureRedirect: "/"
}),
async function (req, res) {
	res.redirect("/");
});

app.get("/instagram/myPosts", async function(req, res) {
	if (process.env.NODE_ENV == "test") {
		req.user = {};
		req.user.instagram = {};
		req.user.instagram.accessToken = "token";
	}
	if (req.user && req.user.instagram && req.user.instagram.accessToken) {
		try {
			const resp = await fetch("https://api.instagram.com/v1/users/self/media/recent/?access_token=" + req.user.instagram.accessToken);
			if (!resp.ok) {
				throw new Error("Error: " + resp.code);
			} else {
				const con = await resp.json();
				const body = await con.data;
				res.send(body);
			}
		} catch(error) {
			res.status(400);
			res.json({message: "Error: " + error});
		}
	} else {
		res.status(403);
		res.json({message:"Not logged in"});
	}
});

// logout of all platforms
app.get("/logout", async function (req, res) {
	await req.logout();
	res.redirect("/");
});

const postsFeed = [
	{
		from: "onefeedposts",
		url: "http://127.0.0.1:8090",
		author: "admin",
		text: "Welcome to OneFeed!"
	}
];
// some dad jokes to display - no external request required
// urls provided for attribution (copyright purposes)
const jokes = [
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/9zyjbd/today_my_son_asked_can_i_have_a_book_mark_and_i/",
		author: "ebkbk",
		text: "Today, my son asked \"Can I have a book mark?\" and I burst into tears. 11 years old and he still doesn't know my name is Brian."
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/8rvscd/as_i_handed_my_dad_his_50th_birthday_card_he/",
		author: "porichoygupto",
		text: "As I handed my Dad his 50th birthday card, he looked at me with tears in his eyes and said, \"you know, one would have been enough\"."
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/9ark5f/if_pronouncing_my_bs_as_vs_makes_me_sound_russian/",
		author: "buckeyespud",
		text: "If pronouncing my b's as v's makes me sound Russian, then soviet."
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/b8cgvx/of_all_the_inventions_of_the_last_100_years_the/",
		author: "Foreverxtrue24",
		text: "Of all the inventions of the last 100 years, the dry erase board has to be the most remarkable."
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/7b61gk/what_has_4_letters_sometimes_has_9_letters_but/",
		author: "TheInstituteOfSteel",
		text: "What has 4 letters, sometimes has 9 letters, but never has 5 letters."
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/a6k9bp/i_got_the_words_jacuzzi_and_yakuza_confused/",
		author: "porichoygupto",
		text: "I got the words \"jacuzzi\" and \"yakuza\" confused. Now I'm in hot water with the Japanese mafia."
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/86158j/i_got_an_email_saying_at_google_earth_we_can_read/",
		author: "madazzahatter",
		text: "I got an e-mail saying, \"At Google Earth, we can read maps backwards!\" and I thought... \"That's just spam.\""
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/7znqmk/when_a_woman_is_giving_birth_she_is_literally/",
		author: "ownworldman",
		text: "When a woman is giving birth, she is literally kidding."
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/8gzvpm/my_wife_is_really_mad_at_the_fact_that_i_have_no/",
		author: "porichoygupto",
		text: "My wife is really mad at the fact that I have no sense of direction. So I packed up my stuff and right."
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/a1uxsk/geology_rocks_but_geography_is_where_its_at/",
		author: "Tempsilon",
		text: "Geology rocks but geography is where it's at"
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/a9y2ex/scientists_got_bored_watching_the_earth_turn_so/",
		author: "RaptorDesign",
		text: "Scientists got bored watching the earth turn, so after 24 hours. They called it a day."
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/7bshlt/if_a_child_refuses_to_sleep_during_nap_time_are/",
		author: "korpsart",
		text: "If a child refuses to sleep during nap time, are they guilty of resisting a rest?"
	},
	{
		from: "jokeList",
		url: "https://www.reddit.com/r/dadjokes/comments/axzvde/nothings_better_than_being_2_3_5_7_11_13_17_19_23/",
		author: "garboooge",
		text: "Nothing’s better than being 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, or 97 years old. Those are the years you’re in your prime."
	}
];

// send the list of jokes kept by the server
app.get("/listJokes", function (req, res) {
	res.send(jokes);
});

app.get("/listPosts", function (req, res) {
	res.send(postsFeed);
});

// add a joke to the list kept by the server
app.post("/addJoke", function (req, res) {
	if (req.user && (req.user.instagram || req.user.twitter || req.user.youtube) || process.env.NODE_ENV == "test") {
		// ensure the joke exists
		if (req.body.joke && req.body.joke.length > 0) {
			const joke = req.body.joke;
			// ensure the joke is a string
			if (typeof joke !== "string") {
				res.status(400);
				res.json({message:"Bad joke"});
			} else {
				const jokeObj = {};
				jokeObj.text = joke;
				if (req.body.author && req.body.author.length > 0) {
					jokeObj.author = req.body.author;
				} else {
					jokeObj.author = "anonymous";
				}
				jokeObj.url = "http://127.0.0.1:8090";
				jokeObj.from = "onefeed";
				jokes.push(jokeObj);
				// successful
				res.json({message:"Success"});
			}
		} else {
			res.status(400);
			res.json({message:"Joke not provided"});
		}
	} else {
		res.status(403);
		res.json({message: "Not authenticated"});
	}
});

app.post("/addPost", function (req, res) {
	if (req.user && (req.user.instagram || req.user.twitter || req.user.youtube) || process.env.NODE_ENV == "test") {
		// ensure the joke exists
		if (req.body.text && req.body.text.length > 0) {
			const post = req.body.text;
			// ensure the joke is a string
			if (typeof post !== "string") {
				res.status(400);
				res.json({message:"Bad joke"});
			} else {
				const postObj = {};
				postObj.text = post;
				if (req.body.author && req.body.author.length > 0) {
					postObj.author = req.body.author;
				} else {
					postObj.author = "anonymous";
				}
				postObj.url = "http://127.0.0.1:8090";
				postObj.from = "onefeedposts";
				postsFeed.push(postObj);
				// successful
				res.json({message:"Success"});
			}
		} else {
			res.status(400);
			res.json({message:"Joke not provided"});
		}
	} else {
		res.status(403);
		res.json({message:"Not authenticated"});
	}
});

// array of joke authors with related info
const jokeAuthors = [
	{
		name: "ebkbk",
		url: "https://www.reddit.com/user/ebkbk"
	},
	{
		name: "porichoygupto",
		url: "https://www.reddit.com/user/porichoygupto"
	},
	{
		name: "buckeyespud",
		url: "https://www.reddit.com/user/buckeyespud"
	},
	{
		name: "Foreverxtrue24",
		url: "https://www.reddit.com/user/Foreverxtrue24"
	},
	{
		name: "TheInstituteOfSteel",
		url: "https://www.reddit.com/user/TheInstituteOfSteel"
	},
	{
		name: "madazzahatter",
		url: "https://www.reddit.com/user/madazzahatter"
	},
	{
		name: "ownworldman",
		url: "https://www.reddit.com/user/ownworldman"
	},
	{
		name: "Tempsilon",
		url: "https://www.reddit.com/user/Tempsilon"
	},
	{
		name: "RaptorDesign",
		url: "https://www.reddit.com/user/RaptorDesign"
	},
	{
		name: "korpsart",
		url: "https://www.reddit.com/user/korpsart"
	},
	{
		name: "garboooge",
		url: "https://www.reddit.com/user/garboooge"
	}
];

// method to provide a list of joke writers
app.get("/listJokeAuthors", function (req, res) {
	res.send(jokeAuthors);
});

// method to add a new joke writer to the list
app.post("/addJokeAuthor", function (req, res) {
	if (req.user && (req.user.instagram || req.user.twitter || req.user.youtube) || process.env.NODE_ENV == "test") {
		if (req.body.author) {
			const author = req.body.author;
			const authObj = {};
			authObj.name = author;
			// no url if using the web app
			if (req.body.url) {
				authObj.url = req.body.url;
			} else {
				authObj.url = "";
			}
			jokeAuthors.push(authObj);
			res.json({message:"Success"});
		} else {
			res.status(400);
			res.json({message:"No author provided"});
		}
	} else {
		res.status(403);
		res.json({message:"Not authenticated"});
	}
});

// method to list jokes provided by a certain person
app.get("/jokesBy", function (req, res) {
	const out = [];
	// check if author provided
	if (req.query.author) {
		const author = req.query.author;
		// iterate through list of jokes, looking for jokes by the author
		for (const x in jokes) {
			if (jokes[x].author == author) {
				out.push(jokes[x]);
			}
		}
		// output array of jokes written by "author"
		res.send(out);
	} else {
		// author not provided
		res.status(400);
		res.json({message:"No author provided"});
	}
});

app.get("/isJokeAuthor", function (req, res) {
	let out = false;
	// check if author provided
	if (req.query.author) {
		const author = req.query.author;
		// iterate through list of jokes, looking for jokes by the author
		for (const x in jokeAuthors) {
			if (jokeAuthors[x].name == author) {
				out = true;
			}
		}
		// output array of jokes written by "author"
		if (out) {
			res.json({exists:true});
		} else {
			res.json({exists:false});
		}
	} else {
		// author not provided
		res.status(400);
		res.json({message:"No author provided"});
	}
});

module.exports = app;
