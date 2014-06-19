// ==UserScript==
// @name        Tumblr Retags
// @namespace   http://alexhong.net/
// @version     0.6
// @description Adds tags to reblog notes, and wraps all tags for readability.
// @include     *://www.tumblr.com/*
// @require     https://code.jquery.com/jquery-2.0.3.min.js
// @downloadURL https://github.com/alexhong/tumblr-retags/raw/master/tumblr-retags.user.js
// @icon        https://raw.githubusercontent.com/alexhong/tumblr-retags/master/icons/icon64.png
// ==/UserScript==

//* TITLE       Retags **//
//* DEVELOPER   alexhong **//
//* VERSION     0.6 **//
//* DESCRIPTION Adds tags to reblog notes, and wraps all tags for readability. **//
//* FRAME       false **//
//* SLOW        false **//
//* BETA        false **//

var retags = {
	api_key: '3DFxEZm0tGISOmdvWe9Fl1QsQMo1LFqEatnc8GQ68wgF1YTZ4w',
	selectors: '.reblog,.is_reblog,.notification_reblog',
	observer: new MutationObserver(function(ms){
		ms.forEach(function(m){
			retags.tag($(m.addedNodes).filter(retags.selectors));
		});
	}),
	run: function(){
		retags.observer.observe($('body')[0],{childList:true,subtree:true});
		$('head').append(retags.css);
		$('.ui_notes_switcher .part-toggle').append(retags.toggle);
		$('#retags-toggle').change(function(){
			($(this).prop('checked'))
				? $('head').append(retags.css_filter)
				: $('.retags-css.filter').remove()
			;
		});
		retags.tag($(retags.selectors));
		$('body').on('mouseover','.post_tags_inner',function(){
			$(this).attr('class','DISABLED_post_tags_inner');
		});
	},
	destroy: function(){
		retags.observer.disconnect();
		$('.retags,.retags-toggle,.retags-css').remove();
		$('.DISABLED_post_tags_inner').attr('class','post_tags_inner');
	},
	tag: function($el){
		$el.each(function(){
			if ($(this).find('.retags').length) {
				return;
			}
			var url = '';
			// popover
			if ($(this).hasClass('note')) {
				var $container = $(this);
				var url = $container.find('.action').data('post-url');
			// Activity
			} else if ($(this).hasClass('ui_note')) {
				var $container = $(this).find('.stage');
				var url = $container.find('.part_glass').attr('href');
				if ($(this).find('.part_response').length) {
					$(this).addClass('is_response');
				}
			// dashboard
			} else if ($(this).hasClass('notification')) {
				var $container = $(this).find('.notification_sentence');
				var url = $container.find('.notification_target').attr('href');
			}
			if (url) {
				url = url.split('/');
				var host = url[2];
				var id = url[4];
				var cached = localStorage.getItem('retags_'+id);
				if (cached !== null) {
					retags.append($container,JSON.parse(cached));
				} else {
					retags.request($container,id,'http://api.tumblr.com/v2/blog/'+host+'/posts/info?id='+id+'&api_key='+retags.api_key);
				}
			}
		});
	},
	request: 
		(typeof GM_xmlhttpRequest !== 'undefined')
		// if userscript or XKit
		? function($container,id,url) {
			GM_xmlhttpRequest({
				method: 'GET',
				url: url,
				onload: function(data){
					var tags = JSON.parse(data.responseText).response.posts[0].tags;
					localStorage.setItem('retags_'+id,JSON.stringify(tags));
					retags.append($container,tags);
				},
				onerror: function(data){
					retags.append($container,'ERROR: '+data.status);
				}
			});
		}
		// if Chrome extension
		: function($container,id,url) {
			$.getJSON(url,function(data){
				var tags = data.response.posts[0].tags;
				localStorage.setItem('retags_'+id,JSON.stringify(tags));
				retags.append($container,tags);
			}).fail(function(jqXHR,status,error){
				retags.append($container,status.toUpperCase()+': '+(error||jqXHR.status));
			});
		}
	,
	append: function($container,tags){
		var $retags = $('<div class="retags">');
		var container_class = $container.hasClass('note') ? 'with_commentary' : '';
		if (typeof tags === 'string') {
			$retags.addClass('error').append(tags);
			$container.addClass(container_class).append($retags);
		} else if (tags.length) {
			tags.forEach(function(tag){
				$retags.append('<a href="//tumblr.com/tagged/'+tag.replace(/ /g,'-')+'">#'+tag+'</a>');
			});
			$container.addClass(container_class).append($retags);
			$container.closest(retags.selectors).addClass('is_retags');
		}
	},
	toggle:
	'<label class="retags-toggle binary_switch">\
		<input type="checkbox" id="retags-toggle">\
		<span class="binary_switch_track"></span>\
		<span class="binary_switch_button"></span>\
		<span class="binary_switch_label">Show only retags / responses</span>\
	</label>'
	,
	css: 
	'<style class="retags-css">\
		.ui_notes .date_header .part_full_date.stuck { width: 165px; margin-left:400px; }\
		.retags-toggle { top: -1px; margin-left: 15px; }\
		.retags-toggle .binary_switch_label { position: absolute; top: 0; left: 24px; padding: 0 8px; line-height: 14px; white-space: nowrap; }\
		.retags { white-space: normal; margin-top: 10px; }\
		.retags.error { color: #c00000; }\
		.retags + .retags:before { color: #c00000; content: "Warning: You are running multiple copies of Retags."; }\
		.retags + .retags a { display: none; }\
		.retags a { color: #a7a7a7 !important; position: relative; margin-right: 11px; text-decoration: none; }\
		.retags a:hover { color: #969696 !important; }\
		.note .retags { font-size: 12px; line-height: 1.3; }\
		.note .retags a { margin-right: 9px; }\
		.post_notes .notes_outer_container.popover .note.with_commentary span.action { min-height: 0; }\
		.notification .retags a { color: rgba(255,255,255,0.3) !important; }\
		.notification .retags a:hover { color: rgba(255,255,255,0.4) !important; }\
		.ui_note .retags { margin-top: 0; padding: 40px 50px 13px; }\
		.ui_note .retags + .retags { margin-top: -5px; padding-top: 0; }\
		.ui_note .part_response + .retags { margin-top: -7px; padding-top: 0; }\
		.post_full .post_tags { white-space: normal; padding: 1px 0; line-height: 18px; }\
		.post_full .post_tags:after { display: none; }\
		.post_full .post_tags .post_tag,\
		.post_full .post_tags .post_tag.featured { display: inline; padding-top: 2px; padding-bottom: 2px; }\
		.post_full .post_tags .post_tag:after,\
		.retags a:after { content: "\\00a0  "; font-size: 0; line-height: 0; }\
	</style>'
	,
	css_filter: 
	'<style class="retags-css filter">\
		.ui_note { display: none; }\
		.ui_note.is_retags, .ui_note.is_response { display: block; }\
	</style>'
};

(typeof XKit === 'undefined') 
? retags.run()
: XKit.extensions.Lx_retags = {
 	running: false,
	run: function(){
		this.running = true;
		retags.run();
	},
	destroy: function(){
		this.running = false;
		retags.destroy();
	}
};