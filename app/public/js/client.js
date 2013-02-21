// vim: ts=2:sw=2:expandtab
$(function () {
  $(".easydate").easydate();

  $('#encrypted').removeClass('hidden');

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
    CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~',
    gen: function (length) {
      var string = '';
      for (var i = 0; i < length; i++) {
        string += this.CHARS[Math.floor(Math.random() 
          * this.CHARS.length)];
      }
      return string;
    }
  };

  //
  // Create Ajax POST
  // Encrypt new paste (with random password)
  //
  $('input[name="create"]').click(function (event) {
    event.preventDefault();

    var submit = $(this)
      , summary = $('input[name="summary"]').val()
      , content = $('textarea[name="content"]').val()
      , password = '';

    if ($('input[name="encrypted"]').is(':checked')) {
      password = token.gen(24);
      content = encrypt(password, content);
    }

    var data = {
      summary: summary,
      content: content,
      expiration: $('select[name="expiration"]').val(),
      encrypted: password != '' ? 'true' : 'false'
    };

    submit.attr('disabled', true);

    $.post('/create', data, function (data) {
      submit.removeAttr('disabled');

      window.location = url(['/update', data.id, data.secret], password);
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
      , password = location.hash.length > 1 ? location.hash.substring(1) : null;

    if (password) {
      content = encrypt(password, content);
    }

    var data = {
      id: id,
      secret: secret,
      summary: summary,
      content: content
    };

    submit.attr('disabled', true);

    $.post('/update', data, function (data) {
      submit.removeAttr('disabled');
      window.location = func.url(['/update', data.id, data.secret], password);
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

      // with highlighting
      hljs.tabReplace = '    ';
      hljs.initHighlighting();
    }
  }

  //
  // Append the password in urls:
  //
  var urls = $('.urls div');
  if (urls.length > 0 && $('input[name="encrypted"]').val() == 'true') {
    var password = location.hash; // .substring(1); that includes #
    for (var i = 0; i < urls.length; i++) {
      var link = $('a', urls[i]);
      link.append(password);
      link.attr('href', link.attr('href') + password);
    }
  }

  // 
  // Check if the paste is expired. If it is, redirect back to /
  //
  function redirectIfExpired() {
    var expire = new Date($('#expire').data('expire'));
    if (new Date() > expire) {
      window.location = '/?expired';
    }
  }
  if ($('#expire').length > 0) {
    redirectIfExpired();
    setInterval(redirectIfExpired, 1000);
  }
});
