// vim: ts=2:sw=2:expandtab
$(function () {
  $('input[name="selection_all"]').change(function (event) {
    var self = this;
    _.each($('input[name="selection"]'), function (selection) {
      $(selection).prop('checked', $(self).is(':checked'));
    });
  });
  $('.admin_list > tbody > tr').click(function (event) {
    if (event.target.type !== 'checkbox') {
      $(':checkbox', this).trigger('click');
    }
  });
});

