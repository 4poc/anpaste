// vim: ts=2:sw=2:expandtab
$(function () {
  $(".easydate").easydate();

  $('div > #encrypted').parent().removeClass('hidden');
  $('div > #tabkeys').parent().removeClass('hidden');

  function encrypt(password, content) {
    return sjcl.encrypt(password, content);
  }

  function decrypt(password, content) {
    return sjcl.decrypt(password, content);
  }

  function url(args, hash) {
    var url = args.join('/');
    if (typeof hash != 'undefined' && hash != null && hash != '') {
      url += '#' + hash;
    }
    if (url.charAt(0) != '/' && url.indexOf('http') !== 0)
      url = '/' + url;
    return url;
  }

  var token = {
    CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    gen: function (length) {
      var string = '';
      for (var i = 0; i < length; i++) {
        string += this.CHARS[Math.floor(Math.random() 
          * this.CHARS.length)];
      }
      return string;
    }
  };

  $('#tabkeys').change(function (event) {
    var content = $('textarea[name="content"]')[0];
    if ($(this).is(':checked')) {
      tabIndent.render(content);
    }
    else {
      tabIndent.remove(content);
    }
  });

  $('textarea').keydown(function (e) {
    if (e.keyCode == 13) {
      if (e.shiftKey) {
        $('input[type="submit"]').click();
        e.preventDefault();
      }
    }
  });

  //
  // Create Ajax POST
  // Encrypt new paste (with random password)
  //
  $('input[name="create"]').click(function (event) {
    var submit = $(this)
      , summary = $('input[name="summary"]').val()
      , content = $('textarea[name="content"]').val()
      , language = $('#language').val()
      , private = $('#private').val()
      , password = '';

    if ($('input[name="encrypted"]').is(':checked')) {
      password = token.gen(24);
      content = encrypt(password, content);
      event.preventDefault();
    }
    else {
      return;
    }

    var data = {
      summary: summary,
      content: content,
      expire: $('select[name="expire"]').val(),
      private: private,
      language: language,
      encrypted: password != '' ? 'true' : 'false'
    };

    submit.attr('disabled', true);

    $.post('/create', data, function (data) {
      submit.removeAttr('disabled');
      if (session_test) {
        window.location = url([data.id], password);
      }
      else {
        window.location = url(['/update', data.id, data.secret], password);
      }
    });

  });

  //
  // Update Ajax POST
  // (re)encrypt updated paste
  //
  $('input[name="update"]').click(function (event) {
    var submit = $(this)
      , id = $('input[name="id"]').val() 
      , secret = $('input[name="secret"]').val() 
      , summary = $('input[name="summary"]').val()
      , content = $('textarea[name="content"]').val()
      , language = $('#language').val()
      , password = location.hash.length > 1 ? location.hash.substring(1) : null;

    if (password) {
      content = encrypt(password, content);
    }
    else {
      return;
    }

    var data = {
      id: id,
      secret: secret,
      summary: summary,
      content: content,
      language: language
    };

    submit.attr('disabled', true);

    $.post('/update', data, function (data) {
      submit.removeAttr('disabled');
      if (session_test) {
        window.location = url([data.id], password);
      }
      else {
        window.location = url(['/update', data.id, data.secret], password);
      }
    });

    event.preventDefault();
  });

  //
  // Decryption
  //
  var encrypted_data = $('#encrypted-data');
  if (encrypted_data.length > 0) {
    var password = location.hash.substring(1), content;

    try {
      content = sjcl.decrypt(password, encrypted_data.text());
    }
    catch (e) {
      console.log(e);
      content = 'Unable to decrypt client-side encrypted paste.';
    }

    // show decrypted content in textarea (update) or div for show
    if ($('textarea[name="content"]').length > 0) {
      $('textarea[name="content"]').val(content);
    }
    // div element
    else if ($('#content').length > 0) {
      $('#content').text(content);
      // activate syntax highting
    }
  }

  SyntaxHighlighter.all();

  //
  // Append the password in urls:
  //
  var urls = $('a.paste_link');
  if (urls.length > 0 && location.hash.length > 1) {
    var password = location.hash; // .substring(1); that includes #
    for (var i = 0; i < urls.length; i++) {
      var link = $(urls[i]);
      link.attr('href', link.attr('href') + password);
    }
  }

  // 
  // Check if the paste is expired. If it is, redirect back to /
  //
  function redirectIfExpired() {
    var expire = new Date($('#expire').attr('title'));
    if (new Date() > expire) {
      window.location = '/create?expired';
    }
  }
  if ($('#expire').length > 0) {
    redirectIfExpired();
    setInterval(redirectIfExpired, 1000);
  }

  //
  // Hide announce if client-side encryption is checked
  // Hide encryption if announce is checked
  //
  $('#encrypted').change(function (event) {
    if ($(this).is(':checked')) {
      $('div > #private').attr('checked', false).attr('disabled', true);
      $('div > #announce').attr('checked', false).attr('disabled', true);
    }
    else {
      $('div > #announce').removeAttr('disabled');
      $('div > #private').removeAttr('disabled');
    }
  });
  $('#announce').change(function (event) {
    if ($(this).is(':checked'))
      $('div > #encrypted').attr('checked', false).attr('disabled', true);
    else
      $('div > #encrypted').removeAttr('disabled');
  });


  //
  // Change show settings (line numbers and theme) send POST /settings,
  // then reload page.
  //
  $('.options').removeClass('hidden');
  $('#show_theme').change(function (event) {
    post_settings({show_theme: $(this).val()});
  });
  $('#show_line_numbers').change(function (event) {
    post_settings({show_line_numbers: $(this).is(':checked')});
  });
  $('#tabkeys').change(function (event) {
    post_settings({tabkeys: $(this).is(':checked')}, false);
  });
  function post_settings(data, reload) {
    reload = typeof reload === 'undefined' ? true : reload;
    $.post('/settings', data, function (data) {
      if (reload)
        location.reload(true);
    });
  }




});
