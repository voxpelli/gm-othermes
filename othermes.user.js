// ==UserScript==
// @name           OtherMes – GitHub Edition
// @namespace      http://kodfabrik.se/othermes/github/
// @description    Finds other social profiles of the current profile and shows them in the page.
// @include        https://github.com/*
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
		console.log('Inserting icons for ' + screenName);

		var max, i, length, node, listItem, link, image, listContainer, header, list, meta, noFavicon = true, data = cache[screenName];

		if (!data.length) {
			return;
		}

		for (i = 0, length = nodes.length; i < length; i++) {
			node = nodes[i];
			meta = node.parentNode.querySelectorAll('.profilecols .last')[0];

			listContainer = meta.querySelectorAll('.following');
			if (listContainer.length) {
				listContainer = listContainer[0]
				meta.appendChild(listContainer);
			} else {
				listContainer = document.createElement('div');
				listContainer.className = 'following';
			}

			header = document.createElement('h3');
			header.textContent = 'Other profiles';
			header.style.marginTop = '12px';
			listContainer.appendChild(header);

			list = document.createElement('ul');
			list.className = 'avatars';

			data.forEach(function (site) {
				var favicon;

				if (site === 'http://github.com/' + screenName) {
					return;
				}

				listItem = document.createElement('li');
				list.appendChild(listItem);

				link = document.createElement('a');
				link.href = site;
				listItem.appendChild(link);

				link.addEventListener('click', stopIt, false);
				link.style.width = '16px';
				link.style.height = '16px';
				noFavicon = true;
				for (favicon in favicons) {
					if (favicons.hasOwnProperty(favicon)) {
						if ((new RegExp('https?:\\/\\/[\\w.]*' + favicon + '\\.com')).test(site)) {
							link.style.background = 'url(' + favicons[favicon] + ') no-repeat center 0';
							noFavicon = false;
							break;
						}
					}
				}
				if (noFavicon) {
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
					image.style.display = 'inline-block';
					image.style.marginLeft = '0';
					image.style.marginRight = '0';
					link.appendChild(image);
				}
			});

			listContainer.appendChild(list);
		}
	};
	fetchScreenName = function (node) {
		return node.querySelectorAll('span.username')[0].textContent;
	};
	fetchProfile = function (nodes, screenName) {
		console.log('Fetching screenname ' + screenName);
		if (cache[screenName]) {
			insertProfile(nodes, screenName);
		} else {
			GM_xmlhttpRequest({
				method : "GET",
				url : 'http://relspider.herokuapp.com/api/lookup?url=http://github.com/' + screenName,
				onload : function (details) {
					if (details.readyState === 4 && (details.status === 200 || details.status === 0)) {
						cache[screenName] = JSON.parse(details.responseText).related;
						insertProfile(nodes, screenName);
					}
				}
			});
		}
	};
	findProfiles = function (event) {
		var node, tweets, length;
		node = event.target;
		tweets = node.querySelectorAll('.userpage:not(.othermes)');
		length = tweets.length;
		if (length) {
			newTweets = true;
		}
	};
	// document.body.addEventListener("DOMNodeInserted", function (event) {
	// 	findProfiles(event);
	// }, false);
	setInterval(function () {
		var tweets, length, i, screenName, profiles = {};
		if (newTweets === true) {
			console.log('Checking github!');
			tweets = document.querySelectorAll('.userpage:not(.othermes)');
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
	findProfiles({target : document});
}());
