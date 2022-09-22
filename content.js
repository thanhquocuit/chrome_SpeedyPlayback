(function () {
	function getVideo(doc) {
		doc = doc || document

		videoTags = doc.getElementsByTagName('video')
		audioTags = doc.getElementsByTagName('audio')
		// Current playing video
		for (i = 0; i < videoTags.length; i++)
			if (!videoTags[i].paused)
				return videoTags[i];
		for (i = 0; i < videoTags.length; i++)
			if (videoTags[i].played.length != 0)
				return videoTags[i];
		// Current playing audio
		for (i = 0; i < audioTags.length; i++)
			if (!audioTags[i].paused)
				return audioTags[i];
		for (i = 0; i < audioTags.length; i++)
			if (audioTags[i].played.length != 0)
				return audioTags[i];
		// The video or audio found
		if (videoTags.length == 1)
			return videoTags[0]
		if (audioTags.length == 1)
			return audioTags[0]
		// Search in blank iframe: src=''
		iframes = doc.getElementsByTagName('iframe')
		for (i in iframes)
			if (iframes[i].src == '') {
				found = getVideo(iframes[i].contentDocument)
				if (found) return found
			}
		return null;
	}

	smoothForwardTimer = 0;
	smoothForwardLastRate = 1;

	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			if (request.msg == "speedy_change_speed") {
				video = getVideo();
				if (video) {
					if (request.speed == 0.0) {
						if (video.paused)
							video.play();
						else
							video.pause();
						return;
					}
					else if (request.speed < 0.5)
						request.speed = 0.5;
					video.playbackRate = request.speed;
				}
			}
			else if (request.msg == "speedy_go_back") {
				time = 0;
				video = getVideo();
				if (video) {
					if (!request.normal_rate)
						video.playbackRate = 0.5;
					if (video.currentTime - request.time > 0) {
						if (request.smooth_forward) {
							if(smoothForwardTimer == 0) {
								smoothForwardLastRate = video.playbackRate;
								video.playbackRate = Math.abs(request.time) / 0.8;
								clearTimeout(smoothForwardTimer);
								smoothForwardTimer = setTimeout(function () {
									video.playbackRate = smoothForwardLastRate;
									smoothForwardTimer = 0;
								}, 0.8 * 1000.0)
							}
							else
								video.currentTime -= request.time;							
						}
						else
							video.currentTime -= request.time;
					}
					time = video.currentTime;

					sendResponse({ "currentTime": time });
				}
			}
			else if (request.msg == "speedy_current_speed") {
				video = getVideo();
				if (video)
					sendResponse({ "speed": video.playbackRate, "paused": video.paused });
			}
			else if (request.msg == "speedy_set_timespan") {
				video = getVideo();
				if (video) {
					video.currentTime = video.duration * request.percent;
					sendResponse({ "time": video.currentTime, "total": video.duration });
				}
			}
			else if (request.msg == "speedy_toggle_pause") {
				video = getVideo();
				if (video) {
					if (video.paused)
						video.play();
					else 
						video.pause();
					sendResponse({ "speed": video.playbackRate, "paused": video.paused, "muted": video.muted });
				}
			}
			else if (request.msg == "speedy_toggle_mute") {
				video = getVideo();
				if (video) {
					if (video.muted)
						video.muted = false;
					else 
						video.muted = true;
					sendResponse({ "speed": video.playbackRate, "paused": paused, "muted": video.muted });
				}
			}
			else if (request.msg == "speedy_current_time") {
				video = getVideo();
				if (video)
					sendResponse({ "time": video.currentTime, "total": video.duration });
			}
			else if (request.msg == "speedy_skip_ytp") {
				btn = document.getElementsByClassName('ytp-ad-skip-button')
				for (i = 0; i < btn.length; i++)
					btn[i].click();
				btn = document.getElementsByClassName('ytp-ad-overlay-close-button')
				for (i = 0; i < btn.length; i++)
					btn[i].click();
			}
			else if (request.msg == "speedy_skip_to_end"
				|| request.msg == "hotkey_fast_forward") {
				video = getVideo();
				if (video && video.currentTime < video.duration - 1)
					video.currentTime = video.duration - 1;
			}
		});

	window.addEventListener('keydown', function (e) {
		chrome.runtime.sendMessage({ msg: "speedy_key_down", keyCode: e.keyCode }, function (response) {
			if (chrome.runtime.lastError || !response)
				return
			if (e.keyCode == 37 || e.keyCode == 39) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
			}
		})
	});

})()