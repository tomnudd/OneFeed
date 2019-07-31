
// mocking via nock - intercept requests and give an example response
// no external api calls are made during tests!
const request = require("supertest");
const nock = require("nock");
const app = require("./app");

function checkIfArray (res) {
	const jContent = res.body;
	if (!Array.isArray(jContent)) {
		throw new Error("Not a list");
	}
}

function arrayIsOfLength3 (res) {
	const jContent = res.body;
	if (jContent.length != 3) {
		throw new Error("List not of correct length");
	}
}

describe("Test the joke authors service", () => {
	test("GET /listJokeAuthors succeeds", async () => await request(app)
		.get("/listJokeAuthors")
		.expect(200));
	test("GET /listJokeAuthors returns JSON", async () => await request(app)
		.get("/listJokeAuthors")
		.expect("Content-type", /json/));
	test("POST /addJokeAuthor succeeds", async () => request(app)
		.post("/addJokeAuthor")
		.send({ author: "Joe" })
		.set("Accept", "application/json")
		.expect(200));
	test("POST /addJokeAuthor returns JSON", async () => request(app)
		.post("/addJokeAuthor")
		.send({ author: "Joe" })
		.set("Accept", "application/json")
		.expect("Content-type", /json/));
	test("POST /addJokeAuthor fails", async () => request(app)
		.post("/addJokeAuthor")
		.set("Accept", "application/json")
		.expect(400));
	test("POST /addJokeAuthor returns JSON on fail", async () => request(app)
		.post("/addJokeAuthor")
		.set("Accept", "application/json")
		.expect("Content-type", /json/));
	test("GET /isJokeAuthor succeeds", async () => await request(app)
		.get("/isJokeAuthor")
		.query({author:"Tempsilon"})
		.expect(200));
	test("GET /isJokeAuthor returns JSON", async () => await request(app)
		.get("/isJokeAuthor")
		.query({author:"Tempsilon"})
		.expect("Content-type", /json/));
	test("GET /isJokeAuthor returns true", async () => await request(app)
		.get("/isJokeAuthor")
		.query({author:"Tempsilon"})
		.expect(exists));
	test("GET /isJokeAuthor returns false", async () => await request(app)
		.get("/isJokeAuthor")
		.query({author:"notAnAuthor"})
		.expect(doesNotExist));
	test("GET /isJokeAuthor fails", async () => await request(app)
		.get("/isJokeAuthor")
		.expect(400));
	test("GET /isJokeAuthor returns JSON on fail", async () => await request(app)
		.get("/isJokeAuthor")
		.expect("Content-type", /json/));
});

describe("Test the jokes service", () => {
	test("GET /listJokes succeeds", async () => await request(app)
		.get("/listJokes")
		.expect(200));
	test("GET /listJokes returns JSON", async () => await request(app)
		.get("/listJokes")
		.expect("Content-type", /json/));
	test("GET /jokesBy successful", async () => await request(app)
		.get("/jokesBy")
		.query({ author: "porichoygupto" })
		.expect(200));
	test("GET /jokesBy returns JSON when author provided", async () => await request(app)
		.get("/jokesBy")
		.query({ author: "porichoygupto" })
		.expect("Content-type", /json/));
	test("GET /jokesBy returns JSON when author not provided", async () => await request(app)
		.get("/jokesBy")
		.expect("Content-type", /json/));
	test("GET /jokesBy unsuccessful", async () => await request(app)
		.get("/jokesBy")
		.expect(400));
	test("GET /jokesBy returns an array", async () => await request(app)
		.get("/jokesBy")
		.query({ author: "porichoygupto" })
		.expect(checkIfArray));
	test("GET /jokesBy returns a response of correct length", async () => await request(app)
		.get("/jokesBy")
		.query({ author: "porichoygupto" })
		.expect(arrayIsOfLength3));
	test("POST /addJoke succeeds", async () => await request(app)
		.post("/addJoke")
		.send({author: "test", joke: "testJoke"})
		.expect(200));
	test("POST /addJoke returns JSON", async () => await request(app)
		.post("/addJoke")
		.send({author: "test", joke: "testJoke"})
		.expect("Content-type", /json/));
	test("POST /addJoke fails without joke", async () => await request(app)
		.post("/addJoke")
		.send({author:"test"})
		.expect(400));
	test("POST /addJoke returns JSON without joke", async () => await request(app)
		.post("/addJoke")
		.expect("Content-type", /json/));
});

describe("Test the posts service", () => {
	test("GET /listPosts succeeds", async () => await request(app)
		.get("/listPosts")
		.expect(200));
	test("GET /listPosts returns JSON", async () => await request(app)
		.get("/listPosts")
		.expect("Content-type", /json/));
	test("POST /addPost succeeds", async () => await request(app)
		.post("/addPost")
		.send({author: "test", text: "testPost"})
		.expect(200));
	test("POST /addPost returns JSON", async () => await request(app)
		.post("/addPost")
		.send({author: "test", text: "testPost"})
		.expect("Content-type", /json/));
	test("POST /addPost fails without post", async () => await request(app)
		.post("/addPost")
		.send({author:"test"})
		.expect(400));
	test("POST /addPost returns JSON without post", async () => await request(app)
		.post("/addPost")
		.expect("Content-type", /json/));
});

describe("Test subreddits", () => {
	nock("https://reddit.com")
		.persist()
		.get((uri) => uri.includes("top"))
		.reply(200, {
			status: "OK",
			data: {children: [{},{}]},
		});

	test("GET /reddit succeeds", async () => await request(app)
		.get("/reddit")
		.query({subreddit: "dogs"})
		.expect(200));
	test("GET /reddit returns JSON", async () => await request(app)
		.get("/reddit")
		.query({subreddit: "dogs"})
		.expect("Content-type", /json/));
	test("GET /reddit fails without subreddit", async () => await request(app)
		.get("/reddit")
		.expect(400));

	nock("https://oauth.reddit.com")
		.persist()
		.get((uri) => uri.includes("api"))
		.reply(200, {
			status: "OK",
			names: {},
		});

	test("GET /redditSubreddits succeeds", async () => await request(app)
		.get("/redditSubreddits")
		.query({search: "dogs"})
		.expect(200));
	test("GET /redditSubreddits returns JSON", async () => await request(app)
		.get("/redditSubreddits")
		.query({search: "dogs"})
		.expect("Content-type", /json/));
	test("GET /redditSubreddits fails without search term", async () => await request(app)
		.get("/redditSubreddits")
		.expect(400));
	test("GET /redditSubreddits returns JSON without search term", async () => await request(app)
		.get("/redditSubreddits")
		.expect("Content-type", /json/));
	test("GET /redditSubreddits fails if search term too long", async () => await request(app)
		.get("/redditSubreddits")
		.query({search:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"})
		.expect(400));
	test("GET /redditSubreddits returns JSON if search term too long", async () => await request(app)
		.get("/redditSubreddits")
		.query({search:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"})
		.expect("Content-type", /json/));
});

describe("Test timelines", () => {
	nock("https://api.instagram.com")
		.persist()
		.get((uri) => uri.includes("media"))
		.reply(200, {
			status: "OK",
			data: {},
		});

	test("GET /instagram/myPosts succeeds", async () => await request(app)
		.get("/instagram/myPosts")
		.expect(200));
	test("GET /instagram/myPosts returns JSON", async () => await request(app)
		.get("/instagram/myPosts")
		.expect("Content-type", /json/));

	// example of authentication failing
	// 403 returned
	test("GET /tumblr/dashboard fails when not authenticated", async () => await request(app)
		.get("/tumblr/dashboard")
		.expect(403));
	test("GET /tumblr/dashboard returns JSON", async () => await request(app)
		.get("/tumblr/dashboard")
		.expect("Content-type", /json/));

	nock("https://www.googleapis.com")
		.persist()
		.get((uri) => uri.includes("videos"))
		.reply(200, {
			status: "OK",
			items: {},
		});

	test("GET /youtube/popular succeeds", async () => await request(app)
		.get("/youtube/popular")
		.expect(200));
	test("GET /youtube/popular returns JSON", async () => await request(app)
		.get("/youtube/popular")
		.expect("Content-type", /json/));

	nock("https://api.twitter.com")
		.persist()
		.get((uri) => uri.includes("statuses"))
		.reply(200, {
			status: "OK",
			content: {},
		});

	test("GET /twitter/timeline returns JSON", async () => await request(app)
		.get("/twitter/timeline")
		.expect("Content-type", /json/));
	test("GET /twitter/timeline succeeds", async () => await request(app)
		.get("/twitter/timeline")
		.expect(200));
});

describe("Test the Reddit token service", () => {
	nock("https://www.reddit.com")
		.post("/api/v1/access_token")
		.reply(200, {
			access_token: "ACCESSTOKENGOESHERE",
			token_type: "bearer",
			expires_in: 3600,
			scope: "*"
		});

	test("GET /redditToken succeeds", async () => await request(app)
		.get("/redditToken")
		.expect(200));

	nock("https://www.reddit.com")
		.post("/api/v1/access_token")
		.reply(200, {
			access_token: "ACCESSTOKENGOESHERE",
			token_type: "bearer",
			expires_in: 3600,
			scope: "*"
		});

	test("GET /redditToken returns JSON", async () => await request(app)
		.get("/redditToken")
		.expect("Content-type", /json/));

	nock("https://www.reddit.com")
		.post("/api/v1/access_token")
		.reply(200, {
			access_token: "ACCESSTOKENGOESHERE",
			expires_in: 3600,
			scope: "*"
		});

	test("GET /redditToken fails without bearer", async () => await request(app)
		.get("/redditToken")
		.expect(400));

	nock("https://www.reddit.com")
		.post("/api/v1/access_token")
		.reply(200, {
			token_type: "bearer",
			expires_in: 3600,
			scope: "*"
		});

	test("GET /redditToken fails without token", async () => await request(app)
		.get("/redditToken")
		.expect(400));

	nock("https://www.reddit.com")
		.post("/api/v1/access_token")
		.reply(200, {
			access_token: "ACCESSTOKENGOESHERE",
			token_type: "bearer",
			scope: "*"
		});

	test("GET /redditToken fails without expiry", async () => await request(app)
		.get("/redditToken")
		.expect(400));

	nock("https://www.reddit.com")
		.post("/api/v1/access_token")
		.reply(200, {
			access_token: "ACCESSTOKENGOESHERE",
			token_type: "bearer",
			expires_in: 3600,
		});

	test("GET /redditToken fails without scope", async () => await request(app)
		.get("/redditToken")
		.expect(400));

	test("GET /redditToken returns JSON on failure", async () => await request(app)
		.get("/redditToken")
		.expect("Content-type", /json/));
});

function isExpired(res) {
	const jContent = res.body.expired;
	if (jContent != true) {
		throw new Error("Not expired");
	}
}

function isValid(res) {
	const jContent = res.body.expired;
	if (jContent != false) {
		throw new Error("Expired");
	}
}

describe("Test Reddit token expiry service", () => {
	test("GET /redditTokenExpired succeeds", async() => await request(app)
		.get("/redditTokenExpired")
		.query({auth: true, expired: true})
		.expect(200));
	test("GET /redditTokenExpired returns false when not expired", async() => await request(app)
		.get("/redditTokenExpired")
		.query({auth: true, expired: false})
		.expect(isValid));
	test("GET /redditTokenExpired returns JSON when not expired", async() => await request(app)
		.get("/redditTokenExpired")
		.query({auth: true, expired: false})
		.expect("Content-type", /json/));
	test("GET /redditTokenExpired returns true when expired", async() => await request(app)
		.get("/redditTokenExpired")
		.query({auth: true, expired: true})
		.expect(isExpired));
	test("GET /redditTokenExpired returns JSON when expired", async() => await request(app)
		.get("/redditTokenExpired")
		.query({auth: true, expired: true})
		.expect("Content-type", /json/));
	test("GET /redditTokenExpired returns true when not logged in", async() => await request(app)
		.get("/redditTokenExpired")
		.expect(isExpired));
	test("GET /redditTokenExpired returns JSON when not logged in", async() => await request(app)
		.get("/redditTokenExpired")
		.expect("Content-type", /json/));
});

function notLoggedIn(res) {
	const jContent = res.body.auth;
	if (jContent != false) {
		throw new Error("Logged in");
	}
}

describe("Test whether logged in to YouTube", () => {
	test("GET /youtube/isLoggedIn succeeds", async() => await request(app)
		.get("/youtube/isLoggedIn")
		.query({auth: "true"})
		.expect(200));
	test("GET /youtube/isLoggedIn returns JSON with mocked user", async() => await request(app)
		.get("/youtube/isLoggedIn")
		.query({auth: "true"})
		.expect("Content-type", /json/));
	test("GET /youtube/isLoggedIn fails without mocked user", async() => await request(app)
		.get("/youtube/isLoggedIn")
		.query({auth: "false"})
		.expect(notLoggedIn));
	test("GET /youtube/isLoggedIn returns JSON without mocked user", async() => await request(app)
		.get("/youtube/isLoggedIn")
		.query({auth: "false"})
		.expect("Content-type", /json/));
	test("GET /youtube/isLoggedIn fails without auth", async() => await request(app)
		.get("/youtube/isLoggedIn")
		.expect(notLoggedIn));
	test("GET /youtube/isLoggedIn fails without auth", async() => await request(app)
		.get("/youtube/isLoggedIn")
		.expect("Content-type", /json/));
});

describe("Test whether logged in to Tumblr", () => {
	test("GET /tumblr/isLoggedIn succeeds", async() => await request(app)
		.get("/tumblr/isLoggedIn")
		.query({auth: "true"})
		.expect(200));
	test("GET /tumblr/isLoggedIn returns JSON with mocked user", async() => await request(app)
		.get("/tumblr/isLoggedIn")
		.query({auth: "true"})
		.expect("Content-type", /json/));
	test("GET /tumblr/isLoggedIn fails without mocked user", async() => await request(app)
		.get("/tumblr/isLoggedIn")
		.query({auth: "false"})
		.expect(notLoggedIn));
	test("GET /tumblr/isLoggedIn returns JSON without mocked user", async() => await request(app)
		.get("/tumblr/isLoggedIn")
		.query({auth: "false"})
		.expect("Content-type", /json/));
	test("GET /tumblr/isLoggedIn fails without auth", async() => await request(app)
		.get("/tumblr/isLoggedIn")
		.expect(notLoggedIn));
	test("GET /tumblr/isLoggedIn returns JSON without auth", async() => await request(app)
		.get("/tumblr/isLoggedIn")
		.expect("Content-type", /json/));
});

describe("Test whether logged in to Instagram", () => {
	test("GET /instagram/isLoggedIn succeeds", async() => await request(app)
		.get("/instagram/isLoggedIn")
		.query({auth: "true"})
		.expect(200));
	test("GET /instagram/isLoggedIn returns JSON with mocked user", async() => await request(app)
		.get("/instagram/isLoggedIn")
		.query({auth: "true"})
		.expect("Content-type", /json/));
	test("GET /instagram/isLoggedIn fails without mocked user", async() => await request(app)
		.get("/instagram/isLoggedIn")
		.query({auth: "false"})
		.expect(notLoggedIn));
	test("GET /instagram/isLoggedIn returns JSON without mocked user", async() => await request(app)
		.get("/instagram/isLoggedIn")
		.query({auth: "false"})
		.expect("Content-type", /json/));
	test("GET /instagram/isLoggedIn fails without auth", async() => await request(app)
		.get("/instagram/isLoggedIn")
		.expect(notLoggedIn));
	test("GET /instagram/isLoggedIn returns JSON without auth", async() => await request(app)
		.get("/instagram/isLoggedIn")
		.expect("Content-type", /json/));
});

describe("Test whether logged in to Twitter", () => {
	test("GET /twitter/isLoggedIn succeeds", async() => await request(app)
		.get("/twitter/isLoggedIn")
		.query({auth: "true"})
		.expect(200));
	test("GET /twitter/isLoggedIn returns JSON with mocked user", async() => await request(app)
		.get("/twitter/isLoggedIn")
		.query({auth: "true"})
		.expect("Content-type", /json/));
	test("GET /twitter/isLoggedIn fails without mocked user", async() => await request(app)
		.get("/twitter/isLoggedIn")
		.query({auth: "false"})
		.expect(notLoggedIn));
	test("GET /twitter/isLoggedIn returns JSON without mocked user", async() => await request(app)
		.get("/twitter/isLoggedIn")
		.query({auth: "false"})
		.expect("Content-type", /json/));
	test("GET /twitter/isLoggedIn fails without auth", async() => await request(app)
		.get("/twitter/isLoggedIn")
		.expect(notLoggedIn));
	test("GET /twitter/isLoggedIn returns JSON without auth", async() => await request(app)
		.get("/twitter/isLoggedIn")
		.expect("Content-type", /json/));
});

function loggedOut(res) {
	const jContent = res.user;
	if (jContent) {
		throw new Error("Logged in");
	}
}

describe("Test the logout service", () => {
	test("GET /logout returns redirect", async() => await request(app)
		.get("/logout")
		.expect(302));
	test("GET /logout logs user out", async() => await request(app)
		.get("/logout")
		.expect(loggedOut));
});

function exists(res) {
	const jContent = res.body.exists;
	if (jContent != true) {
		throw new Error("Not expired");
	}
}

function doesNotExist(res) {
	const jContent = res.body.exists;
	if (jContent != false) {
		throw new Error("Expired");
	}
}
