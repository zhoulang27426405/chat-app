$(function() {
  // connect socket
  var socket = io.connect();
  // voice tip
  var play_ring = function(url) {
    var embed = '<embed src="'+url+'" loop="0" autostart="true" hidden="true" style="height:0px; width:0px;0px;"></embed>';
    $("#ring").html(embed);
  }
  // do something when user online
  var user = $.cookie('username');
  socket.emit('online', user);

  // do something when group chat && private chat
  $('body').on('submit', 'form', function() {
    var _msg = $(this).find('.btn_send').val();
    if (_msg) {
      var _from = $('.chat_pannel .chat_header').find('.nickname').text();
      var _to = $(this).parent('.messages_item').attr('_room');
      socket.emit('chat message', {
        from: _from,
        to: _to,
        info: _msg
      })
      var _html = '<li class="right">' +
        '<img class="avatar" src="/img/avatar_small.jpg">' +
        '<p class="content">' +
          _msg +
        '</p>' +
      '</li>';
      var $el =  $(this).parent('.messages_item').find('.messages_con');
      $el.find('ul').append(_html);
      $el.scrollTop($el.find('ul').height());
      $(this).find('.btn_send').val('');
    }
    return false;
  });
  // choose chat type
  $('body').on('click', '.chat_item', function() {
    var $this = $(this);
    if ($this.hasClass('info_tip')) {
      $this.removeClass('info_tip');
    }
    if ($this.hasClass('selected')) {
      return;
    }
    $('.selected').removeClass('selected');
    $this.addClass('selected');

    var msg = $this.attr('_room');
    $('.messages_item').hide();
    if (msg == 'group') {
      $('.group').show();
    } else {
      $('.' + msg).show();
    }
  });

  socket.on('broadcast message', function(msg) {
    if ('online' == msg.type) {
      var _html = '<li class="message_sys">' +
        '<div class="message_info">' +
          msg.info + '刚刚进入聊天室' +
        '</div>' +
      '</li>';
      $('.message_public').append(_html);

      var _html2 = '<div class="chat_item" _room="' + msg.info + '">' +
        '<img class="avatar" src="/img/noavatar_small.gif">' +
        '<p class="nickname">' +
          msg.info +
        '</p>' +
      '</div>';
      var _room = msg.info;
      if ($('.' + _room).length <= 0) {
        var _html3 = '<div class="messages_item ' + _room + '" _room="' + _room + '"style="display: none;">' +
          '<div class="messages_con">' +
            '<ul >' +
            '</ul>' +
          '</div>' +
          '<form class="box_footer">' +
            '<input class="btn_send" autocomplete="off" /><button>Send</button>' +
          '</form>' +
        '</div>';
        $('.message_wrap').append(_html3);
      }
      $('.user_list').append(_html2);
      play_ring("/static/ring.wav");
    } else if ('offline' == msg.type) {
      var _html = '<li class="message_sys">' +
        '<div class="message_info">' +
          msg.info + '刚刚退出聊天室' +
        '</div>' +
      '</li>';
      $('.message_public').append(_html);

      $('.chat_item').each(function() {
        if ($(this).find('.nickname').text() == msg.info) {
          var _room = $(this).attr('_room');
          $('.' + _room).remove();
          $(this).remove();
        }
      });
    }
  });
  socket.on('private message', function(msg) {
    if ('online' == msg.type) {
      var _html = '<li class="message_sys">' +
        '<div class="message_info">' +
          msg.info + '!欢迎您加入聊天室' +
        '</div>' +
      '</li>';
      $('.message_public').append(_html);
      $('.chat_pannel .chat_header').find('.nickname').text(msg.info);

      var _html2 = '';
      for (var i in msg.users) {
        if (msg.users[i] != user) {
          _html2 += '<div class="chat_item" _room="' + msg.users[i] + '">' +
            '<img class="avatar" src="/img/noavatar_small.gif">' +
            '<p class="nickname">' +
              msg.users[i] +
            '</p>' +
          '</div>';
          var _room = msg.users[i];
          if ($('.' + _room).length <= 0) {
            var _html3 = '<div class="messages_item ' + _room + '" _room="' + _room + '"style="display: none;">' +
              '<div class="messages_con">' +
                '<ul >' +
                '</ul>' +
              '</div>' +
              '<form class="box_footer">' +
                '<input class="btn_send" autocomplete="off" /><button>Send</button>' +
              '</form>' +
            '</div>';
            $('.message_wrap').append(_html3);
          }
        }
      }
      $('.user_list').html(_html2);
      play_ring("/static/ring.wav");
    }
  });
  socket.on('public message', function(msg) {
    if (msg.type == 'online' || msg.type == 'offline') {
      $('.title_wrap').find('span').text(msg.info);
    }
  })
  socket.on('chat message', function(msg) {
    var _html = '';
    _html += '<li class="message_sys">' +
      '<div class="message_info">' +
        msg.time +
      '</div>' +
    '</li>' +
    '<li class="left">' +
      '<img class="avatar" src="/img/noavatar_small.gif">' +
      '<h4 class="nickname">'+
        msg.from +
      '</h4>'+
      '<p class="content">' +
          msg.info +
      '</p>' +
    '</li>';
    if ('group' == msg.to) {
      $('.group').find('ul').append(_html);
      $('.group').find('.messages_con').scrollTop($('.group').find('ul').height());
      $('.chat_item').each(function() {
        if ('group' == $(this).attr('_room') && !$(this).hasClass('selected')) {
          $(this).addClass('info_tip');
        }
      });
    } else {
      $('.' + msg.from).find('ul').append(_html);
      $('.' + msg.from).find('.messages_con').scrollTop($('.' + msg.from).find('ul').height());
      $('.chat_item').each(function() {
        if ($(this).attr('_room') == msg.from && !$(this).hasClass('selected')) {
          $(this).addClass('info_tip');
        }
      });
    }
    play_ring("/static/ring.wav");
  });
});