//
// Blinken simulator (jhalderm 2013-12)
//
function Blinken(obj) { // {title, author, target}
	if (typeof obj === "undefined") {
		obj = {};
	}

	if (typeof obj.target === "undefined") {
		obj.target = $('body');
	}

	var title = obj.title;
	var author = obj.author;

	// Create and style our environment
	var view = document.createElement('div'),
		scale = document.createElement('div'),
		world = document.createElement('div'),
		floor = document.createElement('div');
	send = document.createElement('button');
	view.appendChild(scale);
	scale.appendChild(world);
	world.appendChild(floor);
	obj.target.append(view);
	view.appendChild(send);
	$(view).css({
		position: 'absolute',
		left: '0',
		right: '0',
		bottom: '0',
		top: '0',
		overflow: 'hidden',
		userSelect: 'none',
		perspective: '2048px',
		webkitPerspective: '2048px'
	});
	$(scale).css({
		position: 'absolute',
		width: '512px',
		height: '512px',
		left: '50%',
		top: '50%',
		marginLeft: '-256px',
		marginTop: '-256px',
		transformStyle: 'preserve-3d',
		webkitTransformStyle: 'preserve-3d'
	});
	$(world).css({
		position: 'absolute',
		width: '512px',
		height: '512px',
		left: '50%',
		top: '50%',
		marginLeft: '-256px',
		marginTop: '-256px',
		transformStyle: 'preserve-3d',
		webkitTransformStyle: 'preserve-3d'
	});
	$(floor).css({
		position: 'absolute',
		width: '768px',
		height: '768px',
		left: '-128px',
		top: '-128px',
		transformStyle: 'preserve-3d',
		webkitTransformStyle: 'preserve-3d',
		backgroundColor: 'rgba(200, 200, 200, .5)'
	});
	$(send).text('Run on Stairs');
	$(send).css({marginTop: '10px', marginLeft: '10px', padding: '5px 10px', fontFamily: 'Helvetica, Arial, FreeSans, sans-serif', fontSize: '15px'});
	send.disabled = true;

	function transform(sel, t) {
		sel.css('transform', t);
		sel.css('webkitTransform', t);
	}
	transform($(floor), 'translateZ(-768px)');

	// Let there be lights
	function createLight(n) {
		var div = document.createElement('div');
		var x = Math.sin(n / 100 * 6 * Math.PI) * 256;
		var y = Math.cos(n / 100 * 6 * Math.PI) * 256;
		var z = (n - 50) * 15;
		transform($(div), 'translateX( ' + x.toFixed(4) + 'px ) ' + 'translateY( ' + y.toFixed(4) + 'px ) ' + 'translateZ( ' + z.toFixed(4) + 'px )');
		world.appendChild(div);
		$(div).css({left: '256px', top: '256px', transformStyle: 'preserve-3d', webkitTransformStyle: 'preserve-3d', position: 'absolute'});
		var light = document.createElement('div');
		div.appendChild(light);
		$(light).css({
			position: 'absolute',
			backgroundColor: 'black',
			width: '20px',
			height: '20px',
			borderRadius: '10px',
			marginLeft: '-10px',
			marginTop: '-10px'
		});
		return light;
	}
	var objects = [];
	for (var i = 0; i < 100; i++) {
		objects.push(createLight(i));
	}

	// Scale world to window
	function setScale() {
		var s = $(view).height() / (4 * $(world).height());
		transform($(scale), 'scale(' + s.toFixed(4) + ',' + s.toFixed(4) + ')');
	}
	setScale();
	$(window).resize(setScale);

	// Position the world
	var worldXAngle = 90,
		worldZAngle = 0,
		depth = 0;
	function updateView() {
		transform($(world), 'translateZ( ' + depth.toFixed(4) + 'px ) ' + 'rotateX(' + worldXAngle.toFixed(4) + 'deg) ' + 'rotateZ( ' + worldZAngle.toFixed(4) + 'deg)');
		for (var i = 0; i < 100; i++) {
			transform($(objects[i]), 'rotateZ( ' + (-worldZAngle).toFixed(4) + 'deg) ' + 'rotateX( ' + (-worldXAngle).toFixed(4) + 'deg)');
		}
	}
	updateView();

	// Change position on mouse events
	var startX = 0,
		startY = 0,
		startXAngle = 0,
		startZAngle = 0,
		moving = false;
	$(view).mousedown(function(e) {
		if (e.which == 1) {
			startX = e.pageX;
			startY = e.pageY;
			startXAngle = worldXAngle;
			startZAngle = worldZAngle;
			moving = true;
		}
	});
	$(view).mousemove(function(e) {
		if (moving && e.which == 1) {
			worldZAngle = startZAngle - (((e.pageX - startX) / $(view).width())) * 180;
			worldXAngle = startXAngle - (((e.pageY - startY) / $(view).height())) * 180;
			worldXAngle = Math.max(Math.min(worldXAngle, 180), 0);
			updateView();
		}
	});
	$(view).mouseup(function(e) {
		moving = false;
	});
	$(view).on("wheel", function(e) {
		if (e.originalEvent.wheelDeltaY) {
			depth += e.originalEvent.wheelDeltaY;
		} else {
			depth -= e.originalEvent.deltaY * 15;
		}
		updateView();
	});

	// Execute user code
	var runId = 0;
	function execStart(code) {
		runId++;
		$(send).click(function() {
			publish(code)
		});
		var myId = runId;
		var lights = Array(100);
		function updateLights() {
			for (var i = 0; i < lights.length; i++) {
				if (typeof lights[i] !== 'object' || lights[i]instanceof Bulb === false) {
					lights[i] = new Bulb();
				}
				objects[i].style.backgroundColor = lights[i].cssColor();
			}
		}
		updateLights();
		var step;
		try {
			step = code(lights);
		} catch (e) {
			$(send).text('Error (see console)');
			throw e;
		}
		updateLights();

		var animate = function() {
			var delay;
			try {
				delay = step(lights);
			} catch (e) {
				$(send).text('Error (see console)');
				throw e;
			}
			updateLights();
			send.disabled = false;
			if (typeof delay !== 'number') {
				delay = 30;
			} else if (delay < 0) {
				runId++;
				return;
			}
			if (myId == runId) {
				setTimeout(animate, delay);
			}
		};
		if (typeof step !== 'function') {
			runId++;
			return;
		}
		animate();
	}
	function execStop() {
		runId++;
	}

	// Publishing
	var published = false;
	var token;
	var apiPath = 'http://blinken.eecs.umich.edu';
	function checkStatus() {
		$.get(apiPath + '/status/' + token, function(data) {
			if (data.value > 0) {
				$(send).text(data.message);
				setTimeout(checkStatus, 500);
			} else if (data.value == 0) {
				$(send).text(data.message + ".  Run again?");
				published = false;
			} else {
				$(send).text(data.message);
				published = false;
			}
		}, 'json');
	}
	function publishJob(code) {
		published = true;
		$(send).text('Sending');
		$.post(apiPath + '/publish', {
			code: code.toString(),
			url: document.location.toString(),
			title: title,
			author: author
		}, function(data) {
			$(send).text('Sent');
			token = data;
			setTimeout(checkStatus, 100);
		});
	}
	function cancelJob(sync) {
		if (typeof token !== 'undefined') {
			$(send).text('Canceling');
			if (sync) {
				(new Image(0, 0)).src = apiPath + '/cancel/' + token;
			} else {
				$.post(apiPath + '/cancel/' + token);
			}
		}
	}
	$(window).unload(function() {
		cancelJob(true);
	});
	$(document).ajaxError(function(event, jqXHR, ajaxSettings, thrownError) {
		$(send).text('Ajax Fail: ' + thrownError);
	});
	function publish(code) {
		if (!published) {
			publishJob(code);
		} else {
			cancelJob();
		}
	}

	// Exported interface:
	this.run = execStart;
	this.stop = execStop;
}

// Make sure we have jquery...
if (!window.jQuery) {
	var script = document.createElement("script");
	script.src = '//ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min.js';
	script.type = 'text/javascript';
	document.getElementsByTagName("head")[0].appendChild(script);
}

//
// Class to represent and manipulate a bulb
//
function Bulb(w, x, y, z) {
	// Reset bulb
	this.clear = function() {
		this.r = this.g = this.b = 0;
		this.a = 1;
	};

	// Create a Bulb:
	//   new Bulb()
	//   new Bulb(existingBulb)
	//   new Bulb(r,g,b)
	//   new Bulb(r,g,b,a)
	this.clear();
	if (typeof w === 'object' && w instanceof Bulb && typeof x === 'undefined' && typeof y === 'undefined' && typeof z === 'undefined') {
		this.r = limit(w.r);
		this.g = limit(w.g);
		this.b = limit(w.b);
		this.a = limit(w.a);
	} else if (typeof w === 'number' && typeof x === 'number' && typeof y === 'number') {
		this.r = w;
		this.g = x;
		this.b = y;
		if (typeof z === 'number') {
			this.a = z;
		}
	}

	// You can set color channels and overall brightness ("alpha") directly.
	// Range is 0-1:
	//   this.r = 0;
	//   this.g = 0;
	//   this.b = 0;
	//   this.a = 1;

	// Set light color: rgb(r,g,b)
	this.rgb = function(r, g, b) {
		this.r = limit(r);
		this.g = limit(g);
		this.b = limit(b);
		this.a = 1;
		return this;
	};

	// Set light color with alpha: rgba(r,g,b,a)
	this.rgba = function(r, g, b, a) {
		this.a = limit(a);
		return this.rgb(r, g, b);
	};

	// Add color of another bulb to this one
	this.add = function(bulb) {
		this.r = limit(this.r + bulb.r);
		this.g = limit(this.g + bulb.g);
		this.b = limit(this.b + bulb.b);
		this.a = limit(this.a + bulb.a);
		return this;
	};

	// Convenience functions for simple colors
	this.black = function() {
		this.r = 0;
		this.g = 0;
		this.b = 0;
		return this;
	};
	this.red = function() {
		this.r = 1;
		this.g = 0;
		this.b = 0;
		return this;
	};
	this.green = function() {
		this.r = 0;
		this.g = 1;
		this.b = 0;
		return this;
	};
	this.blue = function() {
		this.r = 0;
		this.g = 0;
		this.b = 1;
		return this;
	};
	this.cyan = function() {
		this.r = 0;
		this.g = 1;
		this.b = 1;
		return this;
	};
	this.purple = function() {
		this.r = 1;
		this.g = 0;
		this.b = 1;
		return this;
	};
	this.yellow = function() {
		this.r = 1;
		this.g = 1;
		this.b = 0;
		return this;
	};
	this.white = function() {
		this.r = 1;
		this.g = 1;
		this.b = 1;
		return this;
	};

	////////////////////////////////////////////////////////////
	// Internal stuff

	this.gamma = 0.33;

	this.cssColor = function() {
		return 'rgb(' + Math.round(Math.pow(limit(this.a) * limit(this.r), this.gamma) * 255) + ',' + Math.round(Math.pow(limit(this.a) * limit(this.g), this.gamma) * 255) + ',' + Math.round(Math.pow(limit(this.a) * limit(this.b), this.gamma) * 255) + ')';
	};

	function limit(x) {
		return Math.min(1, Math.max(0, x));
	}
}

if (typeof exports !== 'undefined') {
	exports.Bulb = Bulb;
}
