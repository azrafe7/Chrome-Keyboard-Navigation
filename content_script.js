(function() {
    /**
     * This is a small polyfill to get event listeners to be
     * the same for all browsers.
     */
    if(!Element.prototype.addEventListener){var oListeners={};function runListeners(oEvent){if(!oEvent){oEvent=window.event}for(var lstId=0,elId=0,oEvtListeners=oListeners[oEvent.type];elId<oEvtListeners.aEls.length;elId++){if(oEvtListeners.aEls[elId]===this){for(lstId;lstId<oEvtListeners.aEvts[elId].length;lstId++){oEvtListeners.aEvts[elId][lstId].call(this,oEvent)}break}}}Element.prototype.addEventListener=function(sEventType,fListener){if(oListeners.hasOwnProperty(sEventType)){var oEvtListeners=oListeners[sEventType];for(var nElIdx=-1,elId=0;elId<oEvtListeners.aEls.length;elId++){if(oEvtListeners.aEls[elId]===this){nElIdx=elId;break}}if(nElIdx===-1){oEvtListeners.aEls.push(this);oEvtListeners.aEvts.push([fListener]);this["on"+sEventType]=runListeners}else{var aElListeners=oEvtListeners.aEvts[nElIdx];if(this["on"+sEventType]!==runListeners){aElListeners.splice(0);this["on"+sEventType]=runListeners}for(var lstId=0;lstId<aElListeners.length;lstId++){if(aElListeners[lstId]===fListener){return}}aElListeners.push(fListener)}}else{oListeners[sEventType]={aEls:[this],aEvts:[[fListener]]};this["on"+sEventType]=runListeners}};Element.prototype.removeEventListener=function(sEventType,fListener){if(!oListeners.hasOwnProperty(sEventType)){return}var oEvtListeners=oListeners[sEventType];for(var nElIdx=-1,elId=0;elId<oEvtListeners.aEls.length;elId++){if(oEvtListeners.aEls[elId]===this){nElIdx=elId;break}}if(nElIdx===-1){return}for(var lstId=0,aElListeners=oEvtListeners.aEvts[nElIdx];lstId<aElListeners.length;lstId++){if(aElListeners[lstId]===fListener){aElListeners.splice(lstId,1)}}}};

	// inited in start()
    var next_page;
    var prev_page;
    var next_anchor;
    var prev_anchor;
	var lastLocation;
    var isPaused;

	var focusMode = true;
	var debugMode = true;

    var keycodes =
    {               // The keycodes for up down left and right movement.
        left:   37, // This defaults to the arrow keys, but you could
        up:     38, // just as easily set it to the WASD keys.
        right:  39, //
        down:   40  //
    };

    // Special cases for which the normal finding function doesn't work.
    var specialCases = {
        "putlocker" : {
            "url" : "putlocker.is",
            "next_url" : function() {
                url = location.toString();
                matches = url.match(/episode-([0-9]+)/);
                if(matches !== null) {
                    nextNum = (matches[1]/1)+1;
                    url = url.replace(matches[0],'episode-'+((matches[1]/1)+1));
                    return url;
                }
                return false;
            },
            "prev_url" : function() {
                url = location.toString();
                matches = url.match(/episode-([0-9]+)/);
                if(matches !== null && (matches[1]/1) > 1) {
                    nextNum = (matches[1]/1)-1;
                    url = url.replace(matches[0],'episode-'+((matches[1]/1)+1));
                    return url;
                }
                return false;
            }
        },
        "snowflakescomic" : {
            "url": "www.snowflakescomic.com",
            "next_url" : function(){
                return $('table#comicnav tbody tr td:nth-child(6) a').attr('href');
            },
            "prev_url" : function(){
                return $('table#comicnav tbody tr td:nth-child(5) a').attr('href');
            }
        },
        "reddit" :{
            "url": "www.reddit.com",
            "test": function(){
                // TODO: Find reliable way of detecting if RES is installed...
                // return !($('#RESConsole').length); // tests if RES is installed.
                return false;
            }
        },
        "wikipedia" :{
            "url": "wikipedia.org",
            "test": function(){return false;}
        },
        "facebook" :{
            "url": "facebook.com",
            "test": function(){return false;}
        },
        "dreamhost" :{
            "url" : "dreamhost.com",
            "test": function(){return false;}
        },
        "amazon" :{
            "url" : "amazon.co.uk",
            "next_url" : function(){
            	var method1 = /page=([1-9]+[0-9]*)/g.exec(window.location.href);
            	if(method1 !== null){
	                var pgn = parseInt(/page=([1-9]+[0-9]*)/g.exec(window.location.href)[1], 10);
	                return window.location.href.replace(/page=([1-9]+[0-9]*)/g, "page=" + (pgn + 1)).replace(/sr_pg_[0-9]*/g, "sr_pg_" + (pgn + 1));
	            }
	            var method2 = document.getElementById('pagnNextLink');
	            if(method2 !== null){
	            	return method2.href;
	            }
	            return false;
            },
            "prev_url" : function(){
            	var method1 = /page=([1-9]+[0-9]*)/g.exec(window.location.href);
            	if(method1 !== null){
	                var pgn = parseInt(/page=([1-9]+[0-9]*)/g.exec(window.location.href)[1], 10);
	                return window.location.href.replace(/page=([1-9]+[0-9]*)/g, "page=" + (pgn - 1)).replace(/sr_pg_[0-9]*/g, "sr_pg_" + (pgn - 1));
	            }
	            var method2 = document.getElementById('pagnPrevLink');
	            if(method2 !== null){
	            	return method2.href;
	            }
	            return false;
            }
        },
        "ycombinator" :{
            "url" : "news.ycombinator.com",
            "next_url" : function(){
            	var method1 = /p=([1-9]+[0-9]*)/g.exec(window.location.href);
            	if(method1 !== null){
	                var pgn = parseInt(/p=([1-9]+[0-9]*)/g.exec(window.location.href)[1], 10);
	                return window.location.href.replace(/p=([1-9]+[0-9]*)/g, "p=" + (pgn + 1));
	            }
	            var method2 = document.getElementsByClassName('morelink');
	            if(method2.length > 0){
	            	return method2[0].href;
	            }
	            return false;
            },
            "prev_url" : function(){
            	var method1 = /p=([1-9]+[0-9]*)/g.exec(window.location.href);
            	if(method1 !== null){
	                var pgn = parseInt(/p=([1-9]+[0-9]*)/g.exec(window.location.href)[1], 10);
	                return window.location.href.replace(/p=([1-9]+[0-9]*)/g, "p=" + (pgn - 1));
	            }
	            var method2 = document.getElementById('pagnPrevLink');
	            if(method2 !== null){
	            	return method2.href;
	            }
	            return false;
            }
        },
        "apod" :{
            "url" : "apod.nasa.gov",
            "next_url" : function(){
            	var as = document.body.querySelectorAll('[href^=ap]');
            	nl = false;
            	for(var i = 0; i < as.length; i++){
            		if(as[i].textContent === ">") {
                        nl = as[i].href;
                    }
            	}
                return nl;
            },
            "prev_url" : function(){
            	var as = document.body.querySelectorAll('[href^=ap]');
            	nl = false;
            	for(var i = 0; i < as.length; i++){
            		if(as[i].textContent === "<") {
                        nl = as[i].href;
                    }
            	}
                return nl;
            }
        },
        "watchtvseries" :{
            "url" : "watchtvseries",
            "next_url" : function(){
                return $('.npbutton.button-next').first().attr('href');
            },
            "prev_url" : function(){
                return $('.npbutton.button-previous').first().attr('href');
            }
        },
        "stackoverflow" :{
            "url" : function(){
                var stackSites = ["stackexchange.com","pt.stackoverflow.com","askubuntu.com","stackapps.com","mathoverflow.net","superuser.com","serverfault.com","stackoverflow.com"];
                for(var i = 0; i < stackSites.length; i++){
                    if(window.location.host.search(stackSites[i]) != -1){
                        return true;
                    }
                }
                return false;
            },
            "next_url" : function(){
                return false;
            },
            "prev_url" : function(){
                return false;
            }
        }
    };

    function getDomain(url){
        return url.replace('http://','').replace('https://','').split(/[\/?#]/)[0];
    }

    // Checks if the url is one of the special cases above
    function checkIfSpecialCase() {
        var vreturn = false;
        $.each( specialCases, function(index, spec){
            if(isFunction(spec.url)){
                if(spec.url()) {
                    vreturn = spec;
                }
                return false; // break out of each loop
            } else if(window.location.host.search(spec.url) != -1){
                // We have a special case!
                vreturn = spec;
                return false; // break out of each loop
            }
        });
        return vreturn;
    }

    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    function analyse() {
        // Look for links on the current page that contain
        // the words 'next', 'previous' etc somewhere about
        // themselves.
        $('a').each(function(index){
            var href    = $(this).attr('href')  || '';
            var text    = $(this).text()        || '';
            var cclass  = $(this).attr('class') || '';
            var id      = $(this).attr('id')    || '';
            var title   = $(this).attr('title') || '';
            var rel     = $(this).attr('rel')   || '';
            var backRegexes = [
				/^(back|prev|older|previous)\b/i,
				/^<$/i,
			];
            var nextRegexes = [
				/^(next|forward|newer|>)\b/i,
				/^>$/i,
			];
            var i;
            var vars = backRegexes;
            for(i = 0; i < vars.length; i++){
                if(
                    (text.search(vars[i])    != -1 ||
                    cclass.search(vars[i])   != -1 ||
                    id.search(vars[i])       != -1 ||
                    rel.search(vars[i])      != -1 ||
                    title.search(vars[i])    != -1) &&
                    prev_page === false
                ) {
                    prev_anchor = this;
					prev_page = href;
                    break;
                }
            }
            vars = nextRegexes;
            for(i = 0; i < vars.length; i++){
                if(
                    (text.search(vars[i])    != -1 ||
                    cclass.search(vars[i])   != -1 ||
                    id.search(vars[i])       != -1 ||
                    rel.search(vars[i])      != -1 ||
                    title.search(vars[i])    != -1) &&
                    next_page === false
                ) {
                    next_anchor = this;
                    next_page = href;
                    break;
                }
            }
        });

        // If there is no link found on the page, look for a page parameter
        // in the URL and increment/decrement it by 1
        if(prev_page !== false && next_page !== false){
            var page_vars = ["page"];
            for(var i = 0; i < page_vars.length; i++){
                var has_var = getQueryVariable(page_vars[i]) !== false;
                if(has_var){
                    var page = getQueryVariable(page_vars[i]);
                    if(isNumber(page)) {
                        updateUrl(parseInt(page, 10), page_vars[i]);
                        break;
                    }
                }
            }
        }

        return {"current": window.location.href.toString(), "next": next_page, "prev": prev_page};
    }

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function updateUrl(page, varname){
        var url = window.location.href.toString();
        next_page = url.replace(varname+"="+page,varname+"="+(page+1));
        prev_page = url.replace(varname+"="+page,varname+"="+(page-1));
        return {"current": url, "next": next_page, "prev": prev_page};
    }

    /**
     * Checks if current active element is an input,
     * i.e the user might want to press the left and right
     * keys to go left in right in the text they're
     * currently writing and won't want to navigate!
     */
    function checkIfInInput(){
        var el = document.activeElement;
        return (
            el && (
                el.tagName.toLowerCase() == 'input'    ||
                el.tagName.toLowerCase() == 'textarea' ||
                el.contentEditable.toLowerCase() == 'true'
            )
        );
    }

	function tryGoingTo(msg, where) {
		doIfNotPaused(function() {
			if (debugMode) console.log(msg, where);
			if (focusMode) {
				if (where.anchor) {
					where.anchor.focus();
				} else if (where.page) {
					var ok = confirm('Going to ' + msg + ' page:\n' + where.page);
					if (ok) window.location.href = where.page;
				}
			}
			if (!debugMode && !focusMode) {
				window.location.href = where.page;
			}
		});
	}
	
    function keypad(e){
		
		var altShift = (e.shiftKey && e.altKey);
		var leftOrRight = (e.keyCode == keycodes.left || e.keyCode == keycodes.right);
		
        if (!(altShift && leftOrRight) || checkIfInInput()) return;
		
		// fix for ajax
		if (lastLocation != window.location.toString()) start();
		
		if(e.keyCode == keycodes.left) {
            if(prev_page !== false){
				tryGoingTo("prev", {anchor:prev_anchor, page:prev_page});
            }
        } else if(e.keyCode == keycodes.right) {
            if(next_page !== false){
				tryGoingTo("next", {anchor:next_anchor, page:next_page});
            }
        }
    }

    function setKeypad(){
        document.addEventListener('keydown',function(e){
            keypad(e);
        }, false);
    }

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
        return false;
    }

    function doIfNotPaused(callback) {
        chrome.extension.sendRequest({id: 'isPaused?'}, function(response) {
            isPaused = response.value;
            if(!isPaused) {
                callback();
            }
        });
    }

    function start() {
		next_page = false;
		prev_page = false;
		next_anchor = false;
		prev_anchor = false;
		lastLocation = window.location.toString();
		
		if (debugMode) console.log("prev/next analyze!");
		
		var specialCase = checkIfSpecialCase();
        var test = true;
        if(specialCase === false){
            analyse();
        } else {
            // Sometimes we need to test for certain things
            if(typeof specialCase.test !== "undefined"){
                test = specialCase.test();
            }
            if(test === true){
                analyse();
                if(typeof specialCase.next_url !== "undefined"){
                    next_page = specialCase.next_url();
                }
                if(typeof specialCase.prev_url !== "undefined"){
                    prev_page = specialCase.prev_url();
                }
            }
        }
    }

    start();
	setKeypad();
	
})();
