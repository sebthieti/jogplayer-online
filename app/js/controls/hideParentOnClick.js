'use strict';

jpoApp.directive('hideParentOnClick', function() {

  return function($scope, $element, $attrs) {

    var $parent = $element.parent();
    var parent = $parent[0];
    var isParentHidden = false;

    $element.on('click', function() {
      if (!isParentHidden) {
        $parent.css({left: -parent.clientWidth + 'px'});
        if ('showText' in $attrs)
          $element.html($attrs.showText);
      } else {
        $parent.css({ left: '0' });
        if ('hideText' in $attrs)
          $element.html($attrs.hideText);
      }

      isParentHidden = !isParentHidden;
    });
  }

});
