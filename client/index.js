const fetch = window.fetch;
let feed = [];
const subredditList = ["rarepuppers"];

async function serverDown() {
	document.getElementById("serverDown").style.display = "block";
}
async function requireLogIn() {
	document.getElementById("logInToSite").style.display = "block";
}

async function jokeTimeline() {
	try {
		const resp = await fetch("http://127.0.0.1:8090/listJokes", {
			method: "GET",
			headers: {"pragma":"no-cache","cache-control":"no-cache"}
		});
		if (!resp.ok) {
			throw new Error("Error " + resp.code);
		} else {
			const rj = await resp.json();
			feed = feed.concat(rj);
		}
	} catch (error) {
		await serverDown();
		throw new Error("Error: " + error);
	}
}

async function postTimeline() {
	try {
		const resp = await fetch("http://127.0.0.1:8090/listPosts", {
			method: "GET",
			headers: {"pragma":"no-cache","cache-control":"no-cache"}
		});
		if (!resp.ok) {
			throw new Error("Error " + resp.code);
		} else {
			const rj = await resp.json();
			feed = feed.concat(rj);
		}
	} catch (error) {
		await serverDown();
		throw new Error("Error: " + error);
	}
}

async function redditFeed() {
	for (const x in subredditList) {
		try {
			const resp = await fetch("http://127.0.0.1:8090/reddit?subreddit=" + subredditList[x]);
			if (!resp.ok) {
				throw new Error("Error " + resp.code);
			} else {
				const rj = await resp.json();
				for (const y in rj) {
					rj[y].from = "reddit";
				}
				feed = feed.concat(rj);
			}
		} catch (error) {
			await serverDown();
			throw new Error("Error: " + error);
		}
	}
}

async function twitterFeed() {
	try {
		const resp = await fetch("http://127.0.0.1:8090/twitter/timeline");
		if (!resp.ok) {
			throw new Error("Error: " + resp.code);
		} else {
			const rj = await resp.json();
			for (const y in rj) {
				rj[y].from = "twitter";
			}
			feed = feed.concat(rj);
		}
	} catch(error) {
		await serverDown();
		throw new Error("Error: " + error);
	}
}

async function instagramFeed() {
	try {
		const resp = await fetch("http://127.0.0.1:8090/instagram/myPosts");
		if (!resp.ok) {
			throw new Error("Error: " + resp.code);
		} else {
			const rj = await resp.json();
			for (const y in rj) {
				rj[y].from = "instagram";
			}
			feed = feed.concat(rj);
		}
	} catch(error) {
		await serverDown();
		throw new Error("Error: " + error);
	}
}

async function youtubePopular() {
	try {
		const resp = await fetch("http://127.0.0.1:8090/youtube/popular");
		if (!resp.ok) {
			throw new Error("Error: " + resp.code);
		} else {
			const rj = await resp.json();
			for (const y in rj) {
				rj[y].from = "youtube";
			}
			feed = feed.concat(rj);
		}
	} catch(error) {
		await serverDown();
		throw new Error("Error: " + error);
	}
}

// must be grouped together within the same async function
window.onload = async function () {
	// need to check there isn't a token on the server yet first... to add
	try {
		const resp = await fetch("http://127.0.0.1:8090/redditToken");
		if (!resp.ok) {
			throw new Error("Error: " + resp.code);
		} else {
			const rj = await resp.json();
			const body = await rj.token;
			if (body != true) {
				throw new Error("Error: unable to retrieve Reddit bearer token");
			}
		}
	} catch (error) {
		await serverDown();
		throw new Error("Error: " + error);
	}

	try {
		const resp = await fetch("http://127.0.0.1:8090/instagram/isLoggedIn");
		if (!resp.ok) {
			throw new Error("Error " + resp.code);
		} else {
			const rj = await resp.json();
			const auth = await rj.auth;
			if (auth == true) {
				document.getElementById("igItem").style.display = "none";
				document.getElementById("logout").style.display = "inline";
				document.getElementById("instagramCheckbox").disabled = false;
			}
		}
	} catch (error) {
		await serverDown();
		throw new Error("Error: " + error);
	}

	try {
		const resp = await fetch("http://127.0.0.1:8090/youtube/isLoggedIn");
		if (!resp.ok) {
			throw new Error("Error " + resp.code);
		} else {
			const rj = await resp.json();
			const auth = await rj.auth;
			if (auth) {
				document.getElementById("ytItem").style.display = "none";
				document.getElementById("logout").style.display = "inline";
				document.getElementById("youtubeCheckbox").disabled = false;
			}
		}
	} catch (error) {
		await serverDown();
		throw new Error("Error: " + error);
	}

	try {
		const resp = await fetch("http://127.0.0.1:8090/twitter/isLoggedIn");
		if (!resp.ok) {
			throw new Error("Error " + resp.code);
		} else {
			const rj = await resp.json();
			const auth = await rj.auth;
			if (auth) {
				document.getElementById("twItem").style.display = "none";
				document.getElementById("logout").style.display = "inline";
				document.getElementById("twitterCheckbox").disabled = false;
			}
		}
	} catch (error) {
		await serverDown();
		throw new Error("Error: " + error);
	}

	await jokeTimeline();
	await postTimeline();

	$(document).on("click", ".rmv", async function (e) {
		e.preventDefault();
		// need to trim whitespace
		const toRemove = subredditList.indexOf(this.parentElement.textContent.trim());
		// handle error occuring when element not in array
		if (toRemove != -1) {
			subredditList.splice(toRemove, 1);
			this.parentElement.remove();
		}
		for (let y = feed.length-1; y >= 0; y--) {
			if (feed[y].from == "reddit") {
				feed.splice(y,1);
			}
		}
		await redditFeed();
		await updateFeed();
	});

	$(document).on("click", ".additem", async function (e) {
		e.preventDefault();
		$("#badges").append("<span class=\"badge badge-secondary font-weight-lighter\">" + $("#subreddit").val() + " <a href=\"#\" class=\"rmv\"><i class=\"remove fas fa-times\"></i></a></span>");
		subredditList.push($("#subreddit").val());
		$("#subreddit").val("");
		await redditFeed();
		await updateFeed();
	});

	$("#subreddit").autocomplete({
		source: async function (req, res) {
			let subreddits = [];
			if (req.term.length > 0) {
				try {
					const resp = await fetch("http://127.0.0.1:8090/redditSubreddits?search=" + req.term);
					const list = await resp.json();
					subreddits = list;
				} catch (error) {
					await serverDown();
					res.send("Error");
				}
			} else {
				subreddits = ["AskReddit", "news", "politics", "funny", "gaming", "pics", "worldnews", "tifu", "aww", "science"];
			}
			res(subreddits);
		},
		minLength: 0,
		messages: {
			noResults: "",
			results: function () {}
		}
	});

	if (subredditList.length > 0) {
		await redditFeed();
	}
	if (!window) {
		// linter catch
		_addJoke();
		_addPost();
		_logout();
	}

	const twitterCheck = document.getElementById("twitterCheckbox");
	twitterCheck.addEventListener("change", async (event) => {
		if (event.target.checked) {
			await twitterFeed();
			await updateFeed();
		} else {
			for (let y = feed.length-1; y >= 0; y--) {
				if (feed[y].from == "twitter") {
					feed.splice(y,1);
				}
			}
			await updateFeed();
		}
	});

	const youtubeCheck = document.getElementById("youtubeCheckbox");
	youtubeCheck.addEventListener("change", async (event) => {
		if (event.target.checked) {
			await youtubePopular();
			await updateFeed();
		} else {
			for (let y = feed.length-1; y >= 0; y--) {
				if (feed[y].from == "youtube") {
					feed.splice(y,1);
				}
			}
			await updateFeed();
		}
	});

	const jokesCheck = document.getElementById("jokesCheckbox");
	jokesCheck.addEventListener("change", async (event) => {
		if (event.target.checked) {
			await jokeTimeline();
			await updateFeed();
		} else {
			for (let y = feed.length-1; y >= 0; y--) {
				if (feed[y].from == "jokeList" || feed[y].from == "oneFeed") {
					feed.splice(y,1);
				}
			}
			await updateFeed();
		}
	});

	const postsCheck = document.getElementById("postsCheckbox");
	postsCheck.addEventListener("change", async (event) => {
		if (event.target.checked) {
			await postTimeline();
			await updateFeed();
		} else {
			for (let y = feed.length-1; y >= 0; y--) {
				if (feed[y].from == "onefeedposts") {
					feed.splice(y,1);
				}
			}
			await updateFeed();
		}
	});

	const instaCheck = document.getElementById("instagramCheckbox");
	instaCheck.addEventListener("change", async (event) => {
		if (event.target.checked) {
			await instagramFeed();
			await updateFeed();
		} else {
			for (let y = feed.length-1; y >= 0; y--) {
				if (feed[y].from == "instagram") {
					feed.splice(y,1);
				}
			}
			await updateFeed();
		}
	});

	await updateFeed();

};

function shuffle(a) {
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// linkify by https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
function linkify(txt) {
	const reg =/(\b(https?):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
	return txt.replace(reg, function(url) {
		return "<a target=\"_blank\" href=\"" + url + "\">" + url + "</a>";
	});
}

async function updateFeed() {
	const posts = document.getElementById("posts");
	posts.innerHTML = null;
	const top = document.createElement("div");
	top.style.width = "100%";
	top.innerHTML = `<div id="logInToSite" class="alert alert-warning" role="alert">Please log in with at least one strategy to add content.</div>
												<div id="serverDown" class="alert alert-warning" role="alert">OneFeed server down<br/>There may be some reduced functionality.</div>
	                    	<div id="serverDownTW" class="alert alert-warning" role="alert">Twitter server down<br/>There may be some reduced functionality.</div>
	                    	<div id="serverDownRE" class="alert alert-warning" role="alert">Reddit server down<br/>There may be some reduced functionality.</div>
	                    	<div id="serverDownIG" class="alert alert-warning" role="alert">Instagram server down<br/>There may be some reduced functionality.</div>
	                    	<div id="serverDownYT" class="alert alert-warning" role="alert">YouTube server down<br/>There may be some reduced functionality.</div>

												<div class="card gedf-card">
	                        <div class="card-header">
	                            <ul class="nav nav-tabs card-header-tabs" id="myTab" role="tablist">
	                                <li class="nav-item">
	                                    <a class="nav-link active show" id="jokes-tab" data-toggle="tab" href="#jokes" role="tab" aria-controls="jokes" aria-selected="true">Joke</a>
	                                </li>
	                                <li class="nav-item">
	                                    <a class="nav-link" id="tweets-tab" data-toggle="tab" role="tab" aria-controls="tweets" aria-selected="false" href="#tweets">Post</a>
	                                </li>
	                            </ul>
	                        </div>
													<div class="card-body">
															<div class="tab-content">
																	<div class="tab-pane fade active show" id="jokes" role="tabpanel" aria-labelledby="jokes-tab">
																			<div class="form-group">
																					<textarea class="form-control" id="joke" rows="3" placeholder="Submit a joke."></textarea>
																			</div>
																			<div class="form-group">
																				<textarea class="form-control" id="author" rows="1" placeholder="Author"></textarea>
																			</div>
																			<button type="submit" class="btn btn-primary" id="addNew" onclick="_addJoke()">Submit</button>
																	</div>
																	<div class="tab-pane fade" id="tweets" role="tabpanel" aria-labelledby="tweets-tab">
																			<div class="form-group">
																					<textarea class="form-control" id="tweetContent" rows="3" placeholder="Post"></textarea>
																			</div>
																			<div class="form-group">
																				<textarea class="form-control" id="postAuthor" rows="1" placeholder="Author"></textarea>
																			</div>
																			<button type="submit" class="btn btn-primary" id="addPost" onclick="_addPost()">Submit</button>
																	</div>
															</div>
													</div>
	                    </div>`;
	posts.appendChild(top);
	feed = shuffle(feed);
	for (const y in feed) {
		if (feed[y].from == "twitter") {
			feed[y].text = linkify(feed[y].text);

			let media = "";

			if (feed[y].entities && feed[y].entities.media && feed[y].entities.media[0] && feed[y].entities.media[0].type == "photo") {
				media = feed[y].entities.media[0].media_url;
			}

			const link = "https://twitter.com/"+feed[y].user.screen_name+"/statuses/" + feed[y].id_str;

			let inners = "<div class=\"card gedf-card\"> \
							<div class=\"card-header\"> \
								<div class=\"d-flex justify-content-between align-items-center\"> \
									<div class=\"d-flex justify-content-between align-items-center\"> \
										<div class=\"mr-2\">\
											<img class=\"rounded-circle\" width=\"45\" src=\""+feed[y].user.profile_image_url+"\" alt=\"Twitter\"> \
										</div>\
										<div class=\"ml-2\">\
											<div class=\"h5 m-0\"><a target=\"_blank\" href=\"https://www.twitter.com/"+feed[y].user.screen_name+"\">@"+ feed[y].user.screen_name + "</a></div>\
											<div class=\"h7 text-muted\">" + feed[y].user.name + "</div>\
										</div>\
									</div>\
								</div>\
							</div>";
			if (media.length > 0) {
				inners += "<div id=\"cont\" style=\"width: 85%; height: 100%\"><img src=\""+media+"\" width=\"100%\"></div>\
				<div class=\"card-body\">\
					<span class=\"card-text\">" + feed[y].text + "</span>\
				</div>\
				<div class=\"card-footer\">\
					<a class=\"float-right text-muted\" href=\"" + link + "\" target=\"_blank\">via Twitter</a>\
				</div>\
			</div>";
			} else {
				inners += "<div class=\"card-body\">\
					<span class=\"card-text\">" + feed[y].text + "</span>\
				</div>\
				<div class=\"card-footer\">\
					<a class=\"float-right text-muted\" href=\"" + link + "\" target=\"_blank\">via Twitter</a>\
				</div>\
			</div>";
			}
			const content = document.createElement("div");
			content.style.width = "100%";
			content.innerHTML = inners;
			posts.appendChild(content);
		} else if (feed[y].from == "youtube") {
			let media = "youtube.png";
			if (feed[y].snippet.thumbnails && feed[y].snippet.thumbnails.standard) {
				media = feed[y].snippet.thumbnails.standard.url;
			} else if (feed[y].snippet.thumbnails.high) {
				media = feed[y].snippet.thumbnails.high.url;
			} else if (feed[y].snippet.thumbnails.maxres) {
				media = feed[y].snippet.thumbnails.maxres.url;
			} else if (feed[y].snippet.thumbnails.thumbnail) {
				media = feed[y].snippet.thumbnails.thumbnail.url;
			} else if (feed[y].snippet.thumbnails.small) {
				media = feed[y].snippet.thumbnails.small.url;
			}

			const link = "https://www.youtube.com/watch?v=" + feed[y].id;
			const inners = "<div class=\"card gedf-card\"> \
							<div class=\"card-header\"> \
								<div class=\"d-flex justify-content-between align-items-center\"> \
									<div class=\"d-flex justify-content-between align-items-center\"> \
										<div class=\"mr-2\">\
											<img class=\"rounded-circle\" width=\"45\" src=\"youtube.png\" alt=\"YouTube\"> \
										</div>\
										<div class=\"ml-2\">\
											<div class=\"h5 m-0\">"+ feed[y].snippet.channelTitle + "</div>\
											<div class=\"h7 text-muted\"><small>" + feed[y].snippet.channelId + "</small></div>\
										</div>\
									</div>\
								</div>\
							</div>\
								<div class=\"card-body\">\
									<a class=\"card-link\" href=\"" + link + "\">\
											<h5 class=\"card-title\">" + feed[y].snippet.title + "</h5>\
									</a>\
									<div id=\"cont\" style=\"width: 85%; height: 100%\"><a target=\"_blank\" href=\""+link+"\"><img src=\""+media+"\" width=\"100%\"></a></div>\
									<span class=\"card-text\">" + linkify(feed[y].snippet.description).replace(/\n/g, "<br />") + "</span>\
								</div>\
								<div class=\"card-footer\">\
									<a class=\"float-right text-muted\" href=\"" + link + "\" target=\"_blank\">via YouTube</a>\
								</div>\
							</div>";
			const content = document.createElement("div");
			content.style.width = "100%";
			content.innerHTML = inners;
			posts.appendChild(content);
		} else if (feed[y].from == "jokeList") {
			const inners = "<div class=\"card gedf-card\"> \
              <div class=\"card-header\"> \
                <div class=\"d-flex justify-content-between align-items-center\"> \
                  <div class=\"d-flex justify-content-between align-items-center\"> \
                    <div class=\"mr-2\">\
                      <img class=\"rounded-circle\" width=\"45\" src=\"reddit.jpg\" alt=\"Reddit\"> \
                    </div>\
                    <div class=\"ml-2\">\
                      <div class=\"h5 m-0\">u/" + feed[y].author + "</div>\
                      <div class=\"h7 text-muted\">" + feed[y].author + "</div>\
                    </div>\
                  </div>\
                </div>\
              </div>\
              <div class=\"card-body\">\
                <p class=\"card-text\">" + feed[y].text + "</p>\
              </div>\
              <div class=\"card-footer\">\
                <a class=\"float-right text-muted\" href=\"" + feed[y].url + "\" target=\"_blank\">via Reddit</a>\
              </div>\
            </div>";
			const content = document.createElement("div");
			content.style.width = "100%";
			content.innerHTML = inners;
			posts.appendChild(content);
		} else if (feed[y].from == "onefeed" || feed[y].from == "onefeedposts") {
			const inners = "<div class=\"card gedf-card\"> \
							<div class=\"card-header\"> \
								<div class=\"d-flex justify-content-between align-items-center\"> \
									<div class=\"d-flex justify-content-between align-items-center\"> \
										<div class=\"mr-2\">\
											<img class=\"rounded-circle\" width=\"45\" src=\"default.png\" alt=\"OneFeed\"> \
										</div>\
										<div class=\"ml-2\">\
											<div class=\"h5 m-0\">" + feed[y].author + "</div>\
											<div class=\"h7 text-muted\">" + feed[y].author + "</div>\
										</div>\
									</div>\
								</div>\
							</div>\
							<div class=\"card-body\">\
								<p class=\"card-text\">" + feed[y].text + "</p>\
							</div>\
							<div class=\"card-footer\">\
								<a class=\"float-right text-muted\" target=\"_blank\" href=\"" + feed[y].url + "\" target=\"_blank\">via OneFeed</a>\
							</div>\
						</div>";
			const content = document.createElement("div");
			content.style.width = "100%";
			content.innerHTML = inners;
			posts.appendChild(content);

		} else if (feed[y].from == "reddit") {
			let inners = "<div class=\"card gedf-card\"> \
							<div class=\"card-header\"> \
								<div class=\"d-flex justify-content-between align-items-center\"> \
									<div class=\"d-flex justify-content-between align-items-center\"> \
										<div class=\"mr-2\">\
											<img class=\"rounded-circle\" width=\"45\" src=\"reddit.jpg\" alt=\"Reddit\"> \
										</div>\
										<div class=\"ml-2\">\
											<div class=\"h5 m-0\"><a target=\"_blank\" href=\"https://www.reddit.com/u/" + feed[y].data.author + "\">"+ feed[y].data.author + "</a></div>\
											<div class=\"h7 text-muted\">From r/" + feed[y].data.subreddit + "</div>\
										</div>\
									</div>\
								</div>\
							</div>\
							<div class=\"card-body\">\
								<a class=\"card-link\" target=\"_blank\" href=\"https://www.reddit.com" + feed[y].data.permalink + "\">\
										<h5 class=\"card-title\">" + feed[y].data.title + "</h5>\
								</a>";

			if (feed[y].data && feed[y].data.preview && feed[y].data.preview.images && feed[y].data.preview.images[0]) {
				const img = feed[y].data.preview.images[0].source.url;
				inners += "<div id=\"cont\" style=\"width: 85%; height: 100%\"><a target=\"_blank\" href=\"https://www.reddit.com" + feed[y].data.permalink + "\"><img src=\""+img+"\" width=\"100%\"></a></div>";
			}
			inners += "<p class=\"card-text\">" + feed[y].data.selftext + "</p>\
							</div>\
              <div class=\"card-footer\">\
                <a class=\"float-right text-muted\" href=\"https://www.reddit.com" + feed[y].data.permalink + "\" target=\"_blank\">via Reddit</a>\
              </div>\
            </div>";
			const content = document.createElement("div");
			content.style.width = "100%";
			content.innerHTML = inners;
			posts.appendChild(content);

		} else if (feed[y].from == "instagram") {
			let caption = "";
			if (feed[y].caption !== null) {
				caption = feed[y].caption;
			}
			const inners = "<div class=\"card gedf-card\"> \
							<div class=\"card-header\"> \
								<div class=\"d-flex justify-content-between align-items-center\"> \
									<div class=\"d-flex justify-content-between align-items-center\"> \
										<div class=\"mr-2\">\
											<img class=\"rounded-circle\" width=\"45\" src=\""+feed[y].user.profile_picture+"\" alt=\"Instagram\"> \
										</div>\
										<div class=\"ml-2\">\
											<div class=\"h5 m-0\"><a target=\"_blank\" href=\"https://www.instagram.com/"+feed[y].user.username+"\">"+ feed[y].user.full_name + "</a></div>\
											<div class=\"h7 text-muted\"><small>" + feed[y].user.username + "</small></div>\
										</div>\
									</div>\
								</div>\
							</div>\
								<div class=\"card-body\">\
									<div id=\"cont\" style=\"width: 85%; height: 100%\"><a target=\"_blank\" href=\""+feed[y].link+"\"><img src=\"" + feed[y].images.standard_resolution.url + "\" width=\"100%\"></a></div>\
									<span class=\"card-text\">" + caption + "</span>\
								</div>\
								<div class=\"card-footer\">\
									<a class=\"float-right text-muted\" href=\"" + feed[y].link + "\" target=\"_blank\">via Instagram</a>\
								</div>\
							</div>";
			const content = document.createElement("div");
			content.style.width = "100%";
			content.innerHTML = inners;
			posts.appendChild(content);
		}
	}
}

// add a joke to the list
const _addJoke = async function() {
	const item = document.getElementById("joke").value;
	const auth = document.getElementById("author").value;
	try {
		const rsp = await fetch("http://127.0.0.1:8090/addJoke", {
			method: "POST",
			headers: {"Accept": "application/json",
				"Content-Type": "application/json"},
			body: JSON.stringify({joke: item, author: auth})
		});
		if (!rsp.ok) {
			await requireLogIn();
		} else {
			document.getElementById("logInToSite").style.display = "none";
		}
	} catch(error) {
		await serverDown();
		throw new Error("Error: " + error);
	}
};

// call this to add a post via a post request
const _addPost = async function() {
	// send all data, app.js checks whether it's there
	const item = document.getElementById("tweetContent").value;
	const auth = document.getElementById("postAuthor").value;
	try {
		const rsp = await fetch("http://127.0.0.1:8090/addPost", {
			method: "POST",
			headers: {"Accept": "application/json",
				"Content-Type": "application/json"},
			body: JSON.stringify({text: item, author: auth})
		});
		if (!rsp.ok) {
			await requireLogIn();
		} else {
			document.getElementById("logInToSite").style.display = "none";
		}
	} catch(error) {
		await serverDown();
		throw new Error("Error: " + error);
	}
};

const _logout = async function() {
	try {
		const rsp = await fetch("http://127.0.0.1:8090/logout");
		if (!rsp.ok) {
			throw new Error("Unable to log out");
		} else {
			document.getElementById("igItem").style.display = "block";
			document.getElementById("twItem").style.display = "block";
			document.getElementById("ytItem").style.display = "block";
			document.getElementById("logout").style.display = "none";
			document.getElementById("instagramCheckbox").disabled = true;
			document.getElementById("twitterCheckbox").disabled = true;
			document.getElementById("youtubeCheckbox").disabled = true;
		}
	} catch(error) {
		await serverDown();
		throw new Error("Error: " + error);
	}

};
