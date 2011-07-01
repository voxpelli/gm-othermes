// ==UserScript==
// @name           OtherMes
// @namespace      http://kodfabrik.se/othermes/
// @description    Finds other social profiles of the current profile and shows them in the page.
// @include        https://twitter.com/*
// @include        http://twitter.com/*
// ==/UserScript==

(function () {
	var cache = {}, findProfiles, fetchProfile, fetchScreenName, insertProfile, stopIt, newTweets = false, favicons = {
		'plus\\.google' : 'https://plus.google.com/favicon.ico',
		'profiles\\.google' : 'https://plus.google.com/favicon.ico'
	};
	stopIt = function (event) {
		event.stopPropagation();
	};
	insertProfile = function (nodes, screenName) {
		var max, i, length, node, site, link, image, tweetmeta, favicon, noFavicon = true;
		data = cache[screenName];

		for (i = 0, length = nodes.length; i < length; i++) {
			node = nodes[i];
			tweetmeta = node.querySelectorAll('.tweet-meta .extra-icons')[0];
			max = 30;
			for (site in data) {
				if (data.hasOwnProperty(site)) {
					if (!max--) {
						break;
					}
					link = document.createElement('a');
					link.href = site;
					link.className = 'icon';
					tweetmeta.appendChild(link);
					link.addEventListener('click', stopIt, false);
					link.style.width = '16px';
					link.style.height = '16px';
					noFavicon = true;
					for (favicon in favicons) {
						if (favicons.hasOwnProperty(favicon)) {
							if ((new RegExp('https?:\\/\\/[\\w.]*' +favicon + '\\.com')).test(site)) {
								link.style.background = 'url(' + favicons[favicon] + ') no-repeat center 0';
								noFavicon = false;
								break;
							}
						}
					}
					if (noFavicon) {
						link.style.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8KSDAAAAOUlEQVR42qWPsQkAMAzDcnoO9E9pu5UIakINwosGO3ok5aZOB0PxIl9ydYby/wwe9BJJbHVAdIzkBe0E08uRQ876AAAAAElFTkSuQmCC) no-repeat center 3px';
						image = document.createElement('img');
						image.addEventListener('load', (function (link) {
							return function () {
								if (this.naturalHeight !== 0) {
									link.style.background = 'none';
								}
							};
						}(link)), false);
						image.src = site.slice(0, 1 + site.indexOf('/', site.slice(0, 5) === 'https' ? 8 : 7)) + 'favicon.ico';
						image.width = '16';
						image.height = '16';
						link.appendChild(image);
						image.style.marginLeft = '0';
						image.style.marginRight = '0';
					}
				}
			}
		}
	};
	fetchScreenName = function (node) {
		var screenName, i, length;
		length = node.attributes.length;
		for (i = 0; i < length; i++) {
			if (node.attributes[i].name === 'data-screen-name') {
				screenName = node.attributes[i].value;
				break;
			}
		}
		return screenName;
	};
	fetchProfile = function (nodes, screenName) {
		if (cache[screenName]) {
			insertProfile(nodes, screenName);
		}
		else {
			GM_xmlhttpRequest({
				method:"GET",
				url:'https://socialgraph.googleapis.com/otherme?q=http://twitter.com/'+screenName,
				onload:function(details) {
					if (details.readyState == 4 && (details.status == 200 || details.status == 0)) {
						cache[screenName] = JSON.parse(details.responseText);
						insertProfile(nodes, screenName);
					}
				}
			});
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
		var tweets, length, i, screenName, profiles = {};
		if (newTweets === true) {
			tweets = document.querySelectorAll('.stream-tweet:not(.othermes)');
			length = tweets.length;
			for (i = 0; i < length; i++) {
				tweets[i].className = tweets[i].className + ' othermes';
				screenName = fetchScreenName(tweets[i]);
				if (screenName) {
					profiles[screenName] = profiles[screenName] || [];
					profiles[screenName].push(tweets[i]);
				}
			}
			for (screenName in profiles) {
				if (profiles.hasOwnProperty(screenName)) {
					fetchProfile(profiles[screenName], screenName);
				}
			}
			newTweets = false;
		}
	}, 100);
}());
