// ==UserScript==
// @name           OtherMes
// @namespace      http://kodfabrik.se/othermes/
// @description    Finds other social profiles of the current profile and shows them in the page.
// @include        https://twitter.com/*
// @include        http://twitter.com/*
// ==/UserScript==

(function () {
	var cache = {}, findProfiles, fetchProfile, insertProfile, stopIt, newTweets = false, favicons = {
		'plus\\.google' : 'https://plus.google.com/favicon.ico',
		'profiles\\.google' : 'https://plus.google.com/favicon.ico',
		'google' : 'http://www.google.com/favicon.ico',
		'github' : 'https://github.com/favicon.ico',
		'facebook' : 'http://facebook.com/favicon.ico'
	};
	stopIt = function (event) {
		event.stopPropagation();
	};
	insertProfile = function (node, screenName) {
		var site, link, tweetmeta, favicon;
		tweetmeta = node.querySelectorAll('.tweet-meta .extra-icons')[0];
		data = cache[screenName];
		for (site in data) {
			if (data.hasOwnProperty(site)) {
				link = document.createElement('a');
				link.href = site;
				link.className = 'icon';
				tweetmeta.appendChild(link);
				link.addEventListener('click', stopIt, false);
				link.style.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8KSDAAAAOUlEQVR42qWPsQkAMAzDcnoO9E9pu5UIakINwosGO3ok5aZOB0PxIl9ydYby/wwe9BJJbHVAdIzkBe0E08uRQ876AAAAAElFTkSuQmCC) no-repeat center 0';
				for (favicon in favicons) {
					if (favicons.hasOwnProperty(favicon)) {
						if ((new RegExp('https?:\\/\\/[\\w.]*' +favicon + '\\.com')).test(site)) {
							link.style.width = '16px';
							link.style.height = '16px';
							link.style.background = 'url(' + favicons[favicon] + ') no-repeat center 0';
							break;
						}
					}
				}
			}
		}
	};
	fetchProfile = function (node) {
		var screenName, i, length;
		length = node.attributes.length;
		for (i = 0; i < length; i++) {
			if (node.attributes[i].name === 'data-screen-name') {
				screenName = node.attributes[i].value;
				break;
			}
		}
		if (screenName) {
			if (cache[screenName]) {
				insertProfile(node, screenName);
			}
			else {
				GM_xmlhttpRequest({
					method:"GET",
					url:'https://socialgraph.googleapis.com/otherme?q=http://twitter.com/'+screenName,
					onload:function(details) {
						if (details.readyState == 4 && (details.status == 200 || details.status == 0)) {
							cache[screenName] = JSON.parse(details.responseText);
							insertProfile(node, screenName);
						}
					}
				});
			}
		}
	};
	findProfiles = function (event) {
		var node, tweets;
		node = event.target;
		tweets = node.querySelectorAll('.stream-tweet:not(.othermes)');
		length = tweets.length;
		if (length) {
			newTweets = true;
		}
	};
	document.body.addEventListener("DOMNodeInserted", function (event) {
		findProfiles(event);
	}, false);
	setInterval(function () {
		var tweets, length, i;
		if (newTweets === true) {
			tweets = document.querySelectorAll('.stream-tweet:not(.othermes)');
			length = tweets.length;
			for (i = 0; i < length; i++) {
				tweets[i].className = tweets[i].className + ' othermes';
				fetchProfile(tweets[i]);
			}
			newTweets = false;
		}
	}, 100);
}());
