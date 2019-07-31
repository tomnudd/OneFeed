# OneFeed (Programming Summative 2)
April 2019

## Introduction
OneFeed is a web app that combines multiple social media platforms into a single, unique feed.

It is possible to log in to Twitter, Instagram, YouTube, and Tumblr. The user is then given the option to enable and disable certain feeds, and is allowed to select subreddits from Reddits. Content from these feeds is then shown on OneFeed (note that the Tumblr feed is disabled due to current restrictions regarding usage of their API). If a user attempts to access a feed without being authenticated, a 403 error and a JSON response is returned.

Users can submit text posts and jokes to the platform, which are retrievable through the API and are displayed to both the user and others on their feeds. The jokes and posts entities are related to another entity, authors, which contains those who have contributed to the site thus far.

If the server disconnects and the user attempts to access a server-side resource (e.g. jokes, posts), an error is shown on the user's screen.

Cloud deployment: [https://one-feed-app.herokuapp.com/](https://one-feed-app.herokuapp.com/)

### Running tests
To run both jest and eslint, execute the following:
```
npm test
```

To only run eslint, execute the following:
```
npm run pretest
```

In addition to the "eslint:recommended" tests, 31 additional tests are specified in `.eslintrc.js`.

Note that if the following dependencies are not installed, the additional tests will result in an error when running either test or run pretest:
* eslint
* eslint-config-standard
* eslint-plugin-standard
* eslint-plugin-promise
* eslint-plugin-import
* eslint-plugin-node

During testing, [nock](https://www.npmjs.com/package/nock) is used to intercept external requests and return predefined responses when appropriate; no external requests are made during testing. The object containing the user's session is also mocked when required, and the mocking is the combination of this code in app.js along with nock and the tests in app.test.js. Multiple remote web services are used, which are mocked in tests (per the above).

### Starting the server
OneFeed can be installed with the following command (when in the directory):
```
npm install
```

The server can be started with the following command:
```
npm start
```

This allows the site to be accessed at [http://127.0.0.1:8090](http://127.0.0.1:8090).

Additionally, a cloud deployment of the site exists, located at [https://one-feed-app.herokuapp.com/](https://one-feed-app.herokuapp.com/) (there may be a small delay in loading this page).

## Endpoints

### GET reddit
Returns an array of posts from a given subreddit after a certain post id.

This method takes two parameters, `subreddit` (required), which indicates the subreddit to retrieve data from, and `after` (optional), the post id in the subreddit to show posts after.

##### Example request
```
GET http://127.0.0.1:8090/reddit?subreddit=rarepuppers
```

##### Example response
```
[
  {
    data: {
      "subreddit": "rarepuppers",
      "id": "280219328"
    }
  },
  {
    data: {
      "subreddit": "rarepuppers",
      "id": "3219"
    }
  }
]
```

### GET redditSubreddits
Returns an array of a list of subreddits starting in a given search term.

This method takes one parameter, `search` (required), indicating the subreddit to search for.

##### Example request
```
GET http://127.0.0.1:8090/redditSubreddits?search=dogs
```
##### Example response
```
[
  "dogs",
  "dogswithjobs",
  "DogShowerThoughts",
  "dogs_getting_dogs",
  "dogswearinghats",
  "DogsMirin",
  "dogsonroofs",
  "dogswitheyebrows"
]
```

### GET redditTokenExpired
Check whether the Reddit bearer token has expired by comparing the expiry time to the current time.

This method takes no parameters and returns an object indicating whether the token has expired.

##### Example request
```
GET http://127.0.0.1:8090/redditTokenExpired
```

##### Example response
```
{
  "expired": false,
}
```

### GET redditToken
Obtain a new application bearer token from Reddit for the server to use.

This method takes no parameters and returns an object indicating whether the token has been obtained.

##### Example request
```
GET http://127.0.0.1:8090/redditToken
```

##### Example response
```
{
  "token": true
}
```

### GET twitter/isLoggedIn
Check whether authenticated user is logged in to Twitter.

This method takes no parameters and returns an object indicating whether the user is logged in.

##### Example request
```
GET http://127.0.0.1:8090/twitter/isLoggedIn
```

##### Example response
```
{
  "auth": true,
}
```

### GET twitter/login
Endpoint used for handling passport logins to Twitter. Redirects to Twitter for login.

### GET twitter/callback
Endpoint used for handling passport logins to Twitter. Allows the response by Twitter to be noted and redirected.

### GET twitter/timeline
Returns an array of objects of timeline items from Twitter. If the user is not logged in, returns a 403 authentication error.

##### Example request
```
GET http://127.0.0.1:8090/twitter/timeline
```

##### Example response
```
[
  {
    "text": "content",
    "user": {
      ...
    },
    url: "https://twitter.com/",
    ...
  },
  {
    "text": "content too",
    "user": {
      ...
    },
    url: "https://twitter.com/",
    ...
  }
]
```

### GET youtube/isLoggedIn
Check whether authenticated user is logged in to YouTube.

This method takes no parameters and returns an object indicating whether the user is logged in.

##### Example request
```
GET http://127.0.0.1:8090/youtube/isLoggedIn
```

##### Example response
```
{
  "auth": false,
}
```

### GET youtube/login
Endpoint used for handling passport logins to YouTube. Redirects to YouTube for login.

### GET youtube/callback
Endpoint used for handling passport logins to YouTube. Allows the response by YouTube to be noted and redirected.

### GET youtube/popular
Returns an array of objects of popular videos from YouTube. If the user is not logged in, returns a 403 authentication error.

##### Example request
```
GET http://127.0.0.1:8090/youtube/popular
```

##### Example response
```
[
  {
    "from": "youtube",
    "snippet": {
      "title": "title string",
      ...
    },
    ...
  },
  {
    "from": "youtube",
    "snippet": {
      "title": "title string too",
      ...
    },
    ...
  }
]
```

### GET tumblr/isLoggedIn
Check whether authenticated user is logged in to Tumblr.

This method takes no parameters and returns an object indicating whether the user is logged in.

##### Example request
```
GET http://127.0.0.1:8090/tumblr/isLoggedIn
```

##### Example response
```
{
  "auth": true,
}
```

### GET tumblr/login
Endpoint used for handling passport logins to Tumblr. Redirects to Tumblr for login.

### GET tumblr/callback
Endpoint used for handling passport logins to YouTube. Allows the response by YouTube to be noted and redirected.

### GET tumblr/dashboard
Returns an array of objects of dashboard items from Tumblr. If the user is not logged in, returns a 403 authentication error.

##### Example request
```
GET http://127.0.0.1:8090/tumblr/dashboard
```

##### Example response
```
[
  {
    "blog_name": "blog name",
    "blog": {
      ...
    },
    summary: "text content",
    ...
  },
  {
    "blog_name": "blog name",
    "blog": {
      ...
    },
    summary: "text content",
    ...
  },
  ...
]
```

### GET instagram/isLoggedIn
Check whether authenticated user is logged in to Instagram.

This method takes no parameters and returns an object indicating whether the user is logged in.

##### Example request
```
GET http://127.0.0.1:8090/instagram/isLoggedIn
```

##### Example response
```
{
  "auth": true,
}
```

### GET instagram/login
Endpoint used for handling passport logins to Instagram. Redirects to Instagram for login.

### GET instagram/callback
Endpoint used for handling passport logins to Instagram. Allows the response by Instagram to be noted and redirected.

### GET instagram/myPosts
Returns an array of objects of the logged in user's posts to Instagram (endpoints for their feed have been discontinued). If the user is not logged in, returns a 403 authentication error.

##### Example request
```
GET http://127.0.0.1:8090/instagram/login
```

##### Example response
```
[
  {
    id: "731298",
    user: {
      ...
    },
    images: {
      ...
    },
    ...
  },
  ...
]
```

### GET logout
This endpoint is used to log a user out of their current session, if it exists.

##### Example request
```
GET http://127.0.0.1:8090/logout
```

This responds by logging the user out and redirects to [http://127.0.0.1:8090](http://127.0.0.1:8090).

### GET listJokes
Returns an array containing jokes on the site. This method takes no parameters.

##### Example request
```
GET http://127.0.0.1:8090/listJokes
```

##### Example response
```
[
  {
    url: "http://127.0.0.1:8090",
    text: "joke here",
    author: "Bob"
  },
  {
    url: "http://127.0.0.1:8090",
    text: "joke here too",
    author: "Joe"
  }
]
```

### POST addJoke
This method is used to add a joke to the list of joke used by the site.

The user must be logged in with at least one login strategy to add a joke, otherwise, a 403 error is returned.

It takes two parameters, `text` (required), containing the joke content, and `author` (optional; presumed anonymous otherwise), containing the author of a joke. It returns an object indicating whether the joke has been added.

##### Example request
```
POST http://127.0.0.1:8090/addPost
text="Post"&author="User"
```
##### Example response
```
{
  "message": "Success"
}
```

### GET jokesBy
Returns an array of jokes written by a given author. Takes a single parameter, `author` (required).

##### Example request
```
GET http://127.0.0.1:8090/jokesBy?author=Bob
```

##### Example response
```
[
  {
    url: "http://127.0.0.1:8090",
    text: "joke here",
    author: "Bob"
  }
]
```

### GET isJokeAuthor
Returns an object indicating if a given person is recognised as a joke author. Takes a single parameter, `author` (required).

##### Example request
```
GET http://127.0.0.1:8090/isJokeAuthor?author=Bob
```

##### Example response
```
{
  "exists": false,
}
```

### GET listJokeAuthors
Returns an array containing joke authors. This method takes no parameters.

##### Example request
```
GET http://127.0.0.1:8090/listJokeAuthors
```

##### Example response
```
[
  {
    name: "user1",
    url: "https://www.reddit.com/user/user1"
  },
  {
    name: "user2",
    url: "https://www.reddit.com/user/user2"
  },
  ...
]
```

### POST addJokeAuthor
This method is used to add a joke author to the list of joke authors used by the site.

The user must be logged in with at least one login strategy to add a joke author, otherwise, a 403 error is returned.

It takes two parameters, `author` (required), the author's name, and `url` (optional), containing a link to their profile. It returns an object indicating whether the author has been added.

##### Example request
```
POST http://127.0.0.1:8090/addJokeAuthor
author="Lucy"&url="http://www.reddit.com/user/lucy01010101010101017564"
```

##### Example response
```
{
  "message": "Success",
}
```
### GET listPosts
Returns an array containing posts on the site. This method takes no parameters.

##### Example request
```
GET http://127.0.0.1:8090/listPosts
```

##### Example response
```
[
  {
    url: "http://127.0.0.1:8090",
    text: "Post content",
    author: "Mary"
  },
  {
    url: "http://127.0.0.1:8090",
    text: "Post content too",
    author: "Joe"
  }
]
```

### POST addPost
This method is used to add a post to the list of posts used by the site.

The user must be logged in with at least one login strategy to add a joke, otherwise, a 403 error is returned.

It takes two parameters, `text` (required), containing the post content, and `author` (optional; presumed anonymous otherwise), containing the author of a post. It returns an object indicating whether the post has been added.

##### Example request
```
POST http://127.0.0.1:8090/addPost
text="Post"&author="User"
```
##### Example response
```
{
  "message": "Joke not provided"
}
```
