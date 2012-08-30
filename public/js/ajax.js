/**
 * Declarative AJAX development
 *
 * <code>
 *    <a href="/get" class="ajax">Click Me!</a>
 *    <a href="/dialog" class="dialog">Click Me!</a>
 *    <a href="/delete" class="confirm" data-confirm="Are you sure?">Click Me!</a>
 *    <a href="/delete" class="ajax confirm" data-id="3" data-method="DELETE">Click Me!</a>
 *    <form action="/save/" class="ajax">
 *        ...
 *    </form>
 *    <source>
 *        // disable event handlers
 *        $('li a').off('.bluz');
 *        // or
 *        $('li a').off('.ajax');
 *    </source>
 * </code>
 *
 * @author   Anton Shevchuk
 */
(function($){
	$(function() {
		// Ajax global events
		$("#loading")
			.ajaxStart(function(){
				$(this).show();
			})
			.ajaxSuccess(function(event, jqXHR, options){
				if (options.dataType == 'json') {
					try {
					    var data = jQuery.parseJSON(jqXHR.responseText);
					} catch(error) {
					    // its not json
						return false;
					}
					// check handler option
					if (data._handler == undefined) {
						return false;
					}
					// it has the data
					// redirect and reload page
					var callback = null;
					if (data._reload != undefined) {
						callback = function() {
							// reload current page
							window.location.reload();
						}
					} else if (data._redirect != undefined) {
						callback = function() {
							// redirect to another page
							window.location = data.redirect;
						}
					}

					// show messages and run callback after
					if (data._messages != undefined) {
						Messages.setCallback(callback);
						Messages.addMessages(data._messages);
					} else if (callback) {
						callback();
					}

					if (data.callback != undefined && $.isFunction(window[data.callback])) {
						window[data.callback](data);
					}
				}
			})
			.ajaxError(function(event, jqXHR, options, thrownError){
				if (console != undefined) {
					console.error(thrownError, "Response Text:", jqXHR.responseText);
				}
				Messages.addError('Connection is fail');
			})
			.ajaxComplete(function(){
				$(this).hide();
			});

        // get only plain data
        var processData = function(el) {
            var data = el.data();
            var plain = {};

            $.each(data, function(key, value){
                if (
                    typeof value == 'function' ||
                    typeof value == 'object') {
                    return false;
                } else {
                    plain[key] = value;
                }
            });
            return plain;
        };

        // live event handlers
        $('body')
        // Confirmation dialog
        .on('click.bluz.confirm', '.confirm', function(event){
            var $this = $(this);

            var message = $this.data('confirm') ? $this.data('confirm') : 'Are you sure?';
            if (!confirm(message)) {
				event.stopImmediatePropagation();
				event.preventDefault();
            }
        })
		// Ajax links
		.on('click.bluz.ajax', 'a.ajax', function(){
            var $this = $(this);
            if ($this.hasClass('disabled')) {
                // request in progress
                return false;
            }

			var method = $this.data('method');

            var data = processData($this);
            data.json = 1;

            $.ajax({
                url:$this.attr('href'),
				type: (method?method:'post'),
                data: data,
                dataType:'json',
                beforeSend:function() {
                    $this.addClass('disabled');
                },
                complete:function() {
                    $this.removeClass('disabled');
                }
            });
            return false;
        })
		// Ajax load
		.on('click.bluz.ajax', '.load', function(){
			var $this = $(this);
			if ($this.hasClass('disabled')) {
				// request in progress
				return false;
			}

			var method = $this.data('method');
			var target = $this.data('target');
			var source = $this.attr('href') || $this.data('source');

			if (!target) {
				throw "Undefined 'data-target' attribute";
			}

			if (!source) {
				throw "Undefined 'data-source' attribute (and href is missing)";
			}

			$.ajax({
				url: source,
				type: (method?method:'post'),
				data: processData($this),
				dataType:'html',
				beforeSend:function() {
				    $this.addClass('disabled');
				},
				success:function(data) {
					var $target = $(target);
					if ($target.length == 0) {
						throw "Element defined by 'data-target' not found";
					}
					$target.html(data);
				},
				complete:function() {
				    $this.removeClass('disabled');
				}
			});
			return false;
		})
		// Ajax modal dialog
		.on('click.bluz.ajax', '.dialog', function(){
			var $this = $(this);
			if ($this.hasClass('disabled')) {
				// request in progress
				return false;
			}

			var method = $this.data('method');

			$.ajax({
				url:$this.attr('href'),
				type: (method?method:'post'),
				data: processData($this),
				dataType:'html',
				beforeSend:function() {
				   $this.addClass('disabled');
				},
				success:function(data) {
					var $div = $('<div>', {'class': 'modal hide fade'});
					$div.html(data);
					$div.modal({
						keyboard:true,
						backdrop:true
					}).on('shown', function() {
						var onShown = window[$this.attr('shown')];
						if (typeof onShown === 'function') {
							onShown.call($div);
						}
					}).on('hidden', function() {
						var onHidden = window[$this.attr('hidden')];
						if (typeof onHidden === 'function') {
							onHidden.call($div);
						}
						$(this).remove();
					});
					$div.modal('show');
				},
				complete:function() {
				   $this.removeClass('disabled');
				}
			});
			return false;
		})

        // Ajax form
		.on('submit.bluz.ajax', 'form.ajax', function(){
            var $this = $(this);
            if ($this.hasClass('disabled')) {
                // request in progress
                return false;
            }

			var method = $this.attr('method');
            var data = {json: 1}; //responses as json
            var formData = $this.serializeArray();

            for (var i in formData) {
                data[formData[i].name] = formData[i].value;
            }

            $.ajax({
                url: $this.attr('action'),
				type: (method?method:'post'),
                data: data,
                dataType:'json',
                beforeSend:function() {
                    $this.addClass('disabled');
                },
                complete:function() {
                    $this.removeClass('disabled');
                }
            });
            return false;
        })
		;
    });
})(jQuery, undefined);