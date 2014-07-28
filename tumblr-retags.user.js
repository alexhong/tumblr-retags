// ==UserScript==
// @name        Tumblr Retags
// @namespace   http://alexhong.net/
<<<<<<< HEAD
// @version     0.6.8
=======
// @version     0.6.7.1
>>>>>>> FETCH_HEAD
// @description Adds tags to reblog notes, and wraps all tags for readability.
// @grant       GM_xmlhttpRequest
// @include     *://www.tumblr.com/*
// @require     https://code.jquery.com/jquery-2.0.3.min.js
// @downloadURL https://github.com/alexhong/tumblr-retags/raw/master/tumblr-retags.user.js
// @icon        https://raw.githubusercontent.com/alexhong/tumblr-retags/master/icons/icon64.png
// ==/UserScript==

//* TITLE Retags **//
//* DEVELOPER alexhong **//
//* VERSION 0.6.8 **//
//* DESCRIPTION Adds tags to reblog notes, and wraps all tags for readability. **//
//* FRAME false **//
//* SLOW false **//
//* BETA false **//

var retags = {
	api_key: '3DFxEZm0tGISOmdvWe9Fl1QsQMo1LFqEatnc8GQ68wgF1YTZ4w',
	selectors: '.reblog,.is_reblog,.notification_reblog',
	observer: new MutationObserver(function(ms){
		ms.forEach(function(m){
			retags.tag($(m.addedNodes).filter(retags.selectors));
		});
	}),
	run: function() {
		retags.css.appendTo('head');
		retags.add_toggle();
		retags.observer.observe($('body')[0],{childList:true,subtree:true});
		retags.tag(retags.selectors);
	},
	destroy: function() {
		retags.css.detach();
		retags.css_toggle.detach();
		retags.html_toggle.detach();
		retags.observer.disconnect();
		$('.retags').remove();
	},
	add_toggle: function() {
		retags.html_toggle.appendTo('.ui_notes_switcher .part-toggle');
		$('#retags-toggle').change(function(){
			if ($(this).prop('checked')) {
				retags.css_toggle.appendTo('head');
				cookie.set('retags_toggle',1,30);
			} else {
				retags.css_toggle.detach();
				cookie.remove('retags_toggle');
			}
		});
		if (cookie.get('retags_toggle')) {
			$('#retags-toggle').click();
		}
	},
	tag: function(el) {
		$(el).each(function(){
			var $t = $(this), cls, $c, url;
			if ($t.find('div.retags').length) {
				return false;
			}
			// popover
			if ($t.hasClass('note')) {
				cls = 'with_commentary';
				$c = $t;
				url = $c.find('.action').data('post-url');
			// Activity
			} else if ($t.hasClass('ui_note')) {
				if ($t.find('.part_response').length) {
					$t.addClass('is_response');
				}
				cls = 'is_retags';
				$c = $t.find('.stage');
				url = $c.find('.part_glass').attr('href');
			// dashboard
			} else if ($t.hasClass('notification')) {
				$c = $t.find('.notification_sentence');
				url = $c.find('.notification_target').attr('href');
			}
			if (url) {
				url = url.split('/');
				var host = url[2], id = url[4], name = 'retags_'+id;
				if (localStorage && localStorage.getItem(name) !== null) {
					retags.append($t,cls,$c,JSON.parse(localStorage.getItem(name)));
				} else {
					retags.request($t,cls,$c,name,'http://api.tumblr.com/v2/blog/'+host+'/posts/info?id='+id+'&api_key='+retags.api_key);
				}
			}
		});
	},
	request: 
		(typeof GM_xmlhttpRequest !== 'undefined')
		// if userscript or XKit
		? function($t,cls,$c,name,url) {
			GM_xmlhttpRequest({
				method: 'GET',
				url: url,
				onload: function(data) {
					var tags = JSON.parse(data.responseText).response.posts[0].tags;
					retags.append($t,cls,$c,tags);
					retags.store(name,JSON.stringify(tags));
				},
				onerror: function(data) {
					retags.append($t,cls,$c,'ERROR: '+data.status);
				}
			});
		}
		// if Chrome extension
		: function($t,cls,$c,name,url) {
			$.getJSON(url,function(data){
				var tags = data.response.posts[0].tags;
				retags.append($t,cls,$c,tags);
				retags.store(name,JSON.stringify(tags));
			}).fail(function(jqXHR,status,error){
				retags.append($t,cls,$c,status.toUpperCase()+': '+(error||jqXHR.status));
			});
		}
	,
	append: function($t,cls,$c,tags) {
		if (tags.length) {
			var $retags = $('<div class="retags">');
			if (typeof tags === 'string') {
				$retags.append(tags).addClass('error');
			} else {
				tags.forEach(function(tag){
					$retags.append('<a href="//tumblr.com/tagged/'+tag.replace(/ /g,'-')+'">#'+tag+'</a>');
				});				
			}
			$t.addClass(cls);
			$c.append($retags);			
		}
	},
	store: function(name,value) {
		if (localStorage) {
			try {
				localStorage.setItem(name,value);
			} catch(e) {
				localStorage.clear();
			}
		}
	},
	css: 
	$('<style class="retags">\
		.ui_notes .date_header .part_full_date.stuck { width: 165px; margin-left: 400px; }\
		label.retags { top: -1px; margin-left: 15px; }\
		label.retags .binary_switch_label { position: absolute; top: 0; left: 24px; padding: 0 8px; line-height: 14px; white-space: nowrap; }\
		div.retags { white-space: normal; margin-top: 10px; }\
		div.retags.error { color: #c00000; }\
		div.retags + div.retags:before { color: #c00000; content: "Warning: You are running multiple copies of Retags."; }\
		div.retags + div.retags a { display: none; }\
		div.retags a { color: #a7a7a7 !important; position: relative; margin-right: 11px; text-decoration: none; }\
		div.retags a:hover { color: #969696 !important; }\
		.note div.retags { font-size: 12px; line-height: 1.3; }\
		.note div.retags a { margin-right: 9px; }\
		.post_notes .notes_outer_container.popover .note.with_commentary span.action { min-height: 0; }\
		.notification div.retags a { color: rgba(255,255,255,0.3) !important; }\
		.notification div.retags a:hover { color: rgba(255,255,255,0.4) !important; }\
		.ui_note div.retags { margin-top: 0; padding: 40px 50px 13px; }\
		.ui_note div.retags + div.retags { margin-top: -5px; padding-top: 0; }\
		.ui_note .part_response + div.retags { margin-top: -7px; padding-top: 0; }\
		.post_full .post_tags { white-space: normal; padding-top: 1px; padding-bottom: 1px; line-height: 18px; }\
		.post_full .post_tags:after { display: none; }\
		.post_full .post_tags .post_tag, .post_full .post_tags .post_tag.featured { display: inline; padding-top: 2px; padding-bottom: 2px; }\
		.post_full .post_tags .post_tag:after, div.retags a:after { content: "\\00a0  "; font-size: 0; line-height: 0; }\
	</style>')
	,
	css_toggle: 
	$('<style class="retags">\
		.ui_note { display: none; }\
		.ui_note.is_retags, .ui_note.is_response, .ui_note.is_reply, .ui_note.is_photo_reply, .ui_note.is_answer { display: block; }\
	</style>')
	,
	html_toggle:
	$('<label class="retags binary_switch">\
		<input id="retags-toggle" type="checkbox">\
		<span class="binary_switch_track"></span>\
		<span class="binary_switch_button"></span>\
		<span class="binary_switch_label">Show only retags / responses</span>\
	</label>')
};

var cookie = {
	set: function(name,value,days) {
		var expires = '';
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			expires = '; expires='+date.toGMTString();
		}
		document.cookie = name+'='+value+expires;
	},
	get: function(name) {
		var nameEQ = name+'=';
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1,c.length);
			}
			if (c.indexOf(nameEQ) == 0) {
				return c.substring(nameEQ.length,c.length);
			}
		}
		return null;
	},
	remove: function(name) {
		cookie.set(name,'',-1);
	}
};

(typeof XKit === 'undefined') 
? retags.run()
: XKit.extensions.Lx_retags = {
 	running: false,
	run: function() {
		this.running = true;
		retags.run();
	},
	destroy: function() {
		this.running = false;
		retags.destroy();
	}
};
