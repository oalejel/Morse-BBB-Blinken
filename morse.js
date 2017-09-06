(new Blinken({title: "Morse", author: "omar al-ejel"})).run(function(lights) {
	// "EECS OR BUST": . . -.-. ...   --- .-.   -... ..- ... -
	var morseString = ". . -.-. ...   --- .-.   -... ..- ... -";
	var charIndex = 0;
	var morseLength = morseString.length;

	var ditMillis = 200;
	var dahMillis = 700;
	var spaceMillis = 600;
	var nextCharMillis = 200;

	var codeDict = {
		"-": dahMillis,
		".": ditMillis,
		" ": spaceMillis
	};

	var didWait = false;

	// Set the strand to full brightness
	for (i = 0; i < 100; i++) {
		lights[i].a = 1;
	}

	// Return our update function
	return function() {
		// example sequence: on, give 500 wait, off, give 200 wait, on, give 200 wait, off, give 500 wait

		//if we waited 200 ms to distinguish between characters last time...
		didWait = !didWait;
		// Loop over all the lights
		for (i = 0; i < 100; i++) {
			//if next character is a space, make sure to keep lights off
			var isSpace = (morseString[charIndex + 1] === " ");
			(didWait & !isSpace)
				? lights[i].rgb(0, 0, 1)
				: lights[i].rgb(0, 0, 0);
		}

		if (didWait) {
			charIndex++;
			if (charIndex >= morseLength) {
				charIndex = 0;
			}
		}

		// Wait 500 ms until we get called again.

		return didWait
			? codeDict[morseString[charIndex]]
			: nextCharMillis;
	};
});
