	function isSmoothForward() {
		return document.getElementById('cbox-smooth-forward').checked
	}
	window.lastPlaybackRate = 1.0;
	
	var slider = document.getElementById("myRange");
	if(slider){
		slider.onkeydown = function(e){
			e.preventDefault();
			e.stopImmediatePropagation();
		}		
		var genSequenceInterval = 0, genSequenceVal = 1
		function genSequence() {
			clearInterval(genSequenceInterval)
			if(isSmoothForward()){
				return 5.0
			}
			else {
				genSequenceInterval = setTimeout(function(){
					clearInterval(genSequenceInterval)
					genSequenceVal = 1
				}, 400)
				if (genSequenceVal < 1.1)
					genSequenceVal += 0.05
				else if (genSequenceVal < 3)
					genSequenceVal += 1.0
				else if (genSequenceVal < 5)
					genSequenceVal += 2.0
				else
					genSequenceVal = 10
			}
			return genSequenceVal
		}
		slider.onmousewheel = function(e){
			if ( e.wheelDelta < 0)
				slider.value = parseFloat(slider.value) - parseFloat(slider.step);
			else
				slider.value = parseFloat(slider.value) + parseFloat(slider.step);
			slider.oninput()
		}
		var lastInterval = 0, holdButton = ""		
		document.onmouseup = function(){
			clearInterval(lastInterval)
			if(slider.value < 0.75)
				slider.value = 0.75
			if(holdButton != "")
				document.getElementById(holdButton).onclick()
			updateText()
		}
		function updateTogglePause(callback) {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {msg: "speedy_toggle_pause"}, function(response){
					if(chrome.runtime.lastError || !callback || !response)
						return
					callback(response)						
				});
			});
		}
		function updateToggleMute(callback) {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {msg: "speedy_toggle_mute"}, function(response){
					if(chrome.runtime.lastError || !callback || !response)
						return
					callback(response)					
				});
			});
		}
		function timeToString(val){
			time = parseInt(val)
			second = time % 60
			min = parseInt(time / 60)
			hour = parseInt(time / 3600)
			return (hour > 0 ? ( (hour > 24 ? 
									(hour / 24).toFixed(1) + "d "
									: "") 
								+ (hour % 24).toString().padStart(2, "0") + ":") : "")
								+ (min % 60).toString().padStart(2, "0") + ":" 
								+ second.toString().padStart(2, "0")
		}		
		function updateCurrentTime(amount) {
			document.getElementById("myOutput").innerHTML = ""
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					msg: "speedy_go_back", 
					"time": -amount, 
					"normal_rate": true, 
					"smooth_forward": amount < 0 ? false : isSmoothForward()}, 
				function(response) {
					if(chrome.runtime.lastError)
						return
						
					if(response) 
						document.getElementById("myOutput").innerHTML = timeToString(parseInt(response.currentTime))
				});
			});
		}
		function updateText() {
			document.getElementById("myOutput").innerHTML = 'x' + slider.value;
			clearInterval(lastInterval)
			lastInterval = 0
			
			// Send message to content script
			if(slider.value > 0.0){				
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					window.lastPlaybackRate = slider.value;
					chrome.tabs.sendMessage(tabs[0].id, {msg: "speedy_change_speed", speed: slider.value});
				});
			}
			else {
				lastInterval = window.setInterval(function(){
					chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
						chrome.tabs.sendMessage(tabs[0].id, {msg: "speedy_go_back", time: Math.abs(slider.value) * 2.3}, function(response) {
							if(chrome.runtime.lastError)
								return						
							if(response) {
								time = parseInt(response.currentTime)
								second = time % 60
								min = parseInt(time / 60)
								hour = parseInt(time / 3600)
								document.getElementById("myOutput").innerHTML = (hour > 0 ? (hour.toString().padStart(2, "0") + ":") : "")
													+ min.toString().padStart(2, "0") + ":" 
													+ second.toString().padStart(2, "0")
							}
						});
					});
				}, 100)
			}			
		}
		// Update the current slider value (each time you drag the slider handle)
		slider.oninput = function() {
		  updateText();
		}
		// Button reset
		function bindButton(name, bindVal) {
			btn = document.getElementById(name);
			if(!btn) return;			
			btn.onclick = function(){
				slider.value = bindVal;
				updateText();
			};
			btn.ondblclick = function(){
				if(holdButton != "")
					document.getElementById(holdButton).style.backgroundColor = "";
				if(holdButton == name){
					holdButton = ""
					return
				}
				document.getElementById(name).style.backgroundColor = 'lightgreen'
				holdButton = name;
				slider.value = bindVal;
				updateText();
			};
		}
		document.getElementById("btnSet_0").onclick = function(){
			updateTogglePause(function(resp){
				if(resp.paused){
					document.getElementById("btnSet_0_play").style.display = "block"
					document.getElementById("btnSet_0_stop").style.display = "none"
				}
				else {
					document.getElementById("btnSet_0_play").style.display = "none"
					document.getElementById("btnSet_0_stop").style.display = "block"
				}

				//
				if(resp.muted){
					document.getElementById("btnSet_sound_play").style.display = "none"
					document.getElementById("btnSet_sound_stop").style.display = "block"
				}
				else {
					document.getElementById("btnSet_sound_play").style.display = "block"
					document.getElementById("btnSet_sound_stop").style.display = "none"
				}
			})
		};
		document.getElementById("btnSet_sound").onclick = function(){
			updateToggleMute(function(resp){
				if(resp.paused){
					document.getElementById("btnSet_0_play").style.display = "block"
					document.getElementById("btnSet_0_stop").style.display = "none"
				}
				else {
					document.getElementById("btnSet_0_play").style.display = "none"
					document.getElementById("btnSet_0_stop").style.display = "block"
				}
				
				//
				if(resp.muted){
					document.getElementById("btnSet_sound_play").style.display = "none"
					document.getElementById("btnSet_sound_stop").style.display = "block"
				}
				else {
					document.getElementById("btnSet_sound_play").style.display = "block"
					document.getElementById("btnSet_sound_stop").style.display = "none"
				}
			})
		};
		document.getElementById("btnSet_D").onclick = function(){			
			val = slider.value * 2
			if(val > 5)
				slider.max = val
			slider.value = val
			updateText();
		};
		bindButton("btnSet_1", 1.0);
		bindButton("btnSet_1_25", 1.25);
		bindButton("btnSet_1_5", 1.5);
		bindButton("btnSet_1_75", 1.75);
		bindButton("btnSet_2", 2.0);
		//
		document.getElementById("btnBak10").onclick = function(e){
			updateCurrentTime(-genSequence());
			e.stopPropagation();
			e.stopImmediatePropagation()
		};
		document.getElementById("btnFor10").onclick = function(e){
			updateCurrentTime(genSequence());
			e.stopPropagation();
			e.stopImmediatePropagation()
		};		
		document.getElementById("btnEnd").onclick = function(e){
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {msg: "speedy_skip_to_end"});
			});
			e.stopPropagation();
			e.stopImmediatePropagation()
		};
		document.getElementById("btnSkipYoutube").onclick = function(e){
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {msg: "speedy_skip_ytp"});
				chrome.tabs.sendMessage(tabs[0].id, {msg: "speedy_change_speed", speed: window.lastPlaybackRate});
			});
			e.stopPropagation();
			e.stopImmediatePropagation()
		};
		document.getElementById("btnSuspendTabs").onclick = function(e) {			
			chrome.tabs.query({currentWindow: true}, tabs => {
				for(tab of tabs){
					if(!tab.selected){
						console.log('Suspended: ' + tab.title)
						chrome.tabs.discard(tab.id)
					}
				}				
			});
		}		
		
		function windowKeydown(keyCode){
			switch (keyCode) {
			case 37: // left arrow key				
				updateCurrentTime(-genSequence());
				return;
			case 39: // right arrow key
				updateCurrentTime(genSequence());
				return;
			case 40: // down arrow key
				slider.value = parseFloat(slider.value) - parseFloat(slider.step);
				updateText();
				return;							
			case 38: // up arrow key
				slider.value = parseFloat(slider.value) + parseFloat(slider.step);
				updateText();			
				return;	
			case 32: // space
				updateTogglePause({});
				return;
			case 13: // Enter
			case 64: // A
				document.getElementById("btnSkipYoutube").click()
				return;
			}
		}
		window.onkeydown = function(e) {
			windowKeydown(e.keyCode);
			e.preventDefault();
			e.stopImmediatePropagation();
		}
		
		document.getElementById('timespan_cont').addEventListener('click', function(e){
			percent = (e.offsetX / e.currentTarget.clientWidth);
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {"msg": "speedy_set_timespan", "percent": percent}, function(response){
					if(chrome.runtime.lastError || !response)
						return
					time = response ? parseFloat(response.time) : 0.0
					total = response ? parseFloat(response.total) : 1.0	
					document.getElementById("timeBox").innerHTML = timeToString(time) + " / " + timeToString(total)
					document.getElementById("timespan").style.width = (percent*100.0) + "%";
				})
			})
		})
		
		// get current playbackRate
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		  chrome.tabs.sendMessage(tabs[0].id, {msg: "speedy_current_speed"}, function(response) {
				if(chrome.runtime.lastError || !response)
					return
				slider.value = response.speed ? response.speed : 1.0
				if(response.paused){
					document.getElementById("btnSet_0_play").style.display = "block"
					document.getElementById("btnSet_0_stop").style.display = "none"
				}
				else {
					document.getElementById("btnSet_0_play").style.display = "none"
					document.getElementById("btnSet_0_stop").style.display = "block"
				}
		  });
		});
		
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {			
			if (request.msg == "speedy_key_down")
				windowKeydown(request.keyCode);
			sendResponse({ok:"ok"})
		})
		
		// get current playtime
		function syncPlayDuration(){
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {msg: "speedy_current_time"}, function(response) {
					if(chrome.runtime.lastError)
						return
					time = response ? parseFloat(response.time) : 0.0
					total = response ? parseFloat(response.total) : 1.0				
					percent = (time / total) * 100.0
					document.getElementById("timeBox").innerHTML = timeToString(time) + " / " + timeToString(total)
					document.getElementById("timespan").style.width = percent + "%";
					document.getElementById("myOutput").innerHTML = 'x' + slider.value;
				});
			});
		}
		setInterval(function(){
			syncPlayDuration()
		}, 1000);
		syncPlayDuration();
	}
	