//* TITLE Retags **//
//* DEVELOPER alexhong **//
//* VERSION 0.4.1 REV A **//
//* DESCRIPTION Adds tags to reblog notes, and wraps all tags for readability. **//
//* DETAILS Retags displays the tags users added when reblogging a post, in notes popovers and on your dashboard and Activity pages. **//
//* FRAME false **//
//* SLOW false **//
//* BETA false **//

var retags = {
	api_key: 'T1UAblXBunwjrKuX8ZgtC0ukM70zrej2SPLMEAbM56wYWxdWDs',
	api_url: 'http://api.tumblr.com/v2/blog/$1/posts/info?id=$2&api_key=',
	selectors: '.reblog,.is_reblog,.notification_reblog',
	observer: new MutationObserver(function(ms){
		ms.forEach(function(m){
			retags.tag($(m.addedNodes).filter(retags.selectors));
		});
	}),
	run: function(){
		retags.observer.observe(document,{childList:true,subtree:true});
		$('head').append(retags.css);
		retags.tag($(retags.selectors));
		$(document).on('mouseover','.post_tags_inner',function(){
			$(this).attr('class','DISABLED_post_tags_inner');
		});
	},
	destroy: function(){
		retags.observer.disconnect();
		$('.retags-css,.retags').remove();
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
			// dashboard
			} else if ($(this).hasClass('notification')) {
				var $container = $(this).find('.notification_sentence');
				var url = $container.find('.notification_target').attr('href');
			}
			if (url) {
				retags.request($container,url.replace(/^http:\/\/(.+)\/post\/(\d+).*/g,retags.api_url+retags.api_key));
			}
		});
	},
	request: 
		(typeof GM_xmlhttpRequest !== 'undefined')
		// if userscript or XKit
		? function($container,url) {
			GM_xmlhttpRequest({
				method: 'GET',
				url: url,
				onload: function(data){
					retags.append($container,JSON.parse(data.responseText).response.posts[0].tags);
				},
				onerror: function(){
					retags.append($container,'error');
				}
			});
		}
		// if Chrome extension
		: function($container,url) {
			$.getJSON(url,function(data){
				retags.append($container,data.response.posts[0].tags);
			}).fail(function(){
				retags.append($container,'error');
			});
		}
	,
	append: function($container,tags){
		var $retags = $('<div class="retags">');
		var container_class = $container.hasClass('note') ? 'with_commentary' : '';
		if (tags === 'error') {
			$retags.addClass('error').append('Error: Could not access post.');
			$container.addClass(container_class).append($retags);					
		} else if (tags.length) {
			tags.forEach(function(tag){
				$retags.append('<a href="//tumblr.com/tagged/'+tag.replace(/ /g,'-')+'">#'+tag+'</a>');
			});
			$container.addClass(container_class).append($retags);
		}
	},
	css: 
	'<style class="retags-css">\
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
};

XKit.extensions.retags = {
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