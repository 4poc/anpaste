// vim: ts=2:sw=2:expandtab
$(function () {
  $('input[name="selection_all"]').change(function (event) {
    var self = this;
    _.each($('input[name="selection"]'), function (selection) {
      $(selection).prop('checked', $(self).is(':checked'));
    });
  });
});

