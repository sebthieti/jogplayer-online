'use strict';

jpoApp.directive('resizer', ['$window', '$document', function($window, $document) {

  return function($scope, $element, $attrs) {

    var resizerLeft, resizerRight, resizerTop, resizerBottom;

    if ($attrs.resizerLeft)
      resizerLeft = document.querySelector($attrs.resizerLeft);
    if ($attrs.resizerRight)
      resizerRight = document.querySelector($attrs.resizerRight);
    if ($attrs.resizerTop)
      resizerTop = document.querySelector($attrs.resizerTop);
    if ($attrs.resizerBottom)
      resizerBottom = document.querySelector($attrs.resizerBottom);

    $element.on('mousedown', function(event) {
      event.preventDefault();

      $document.on('mousemove', mousemove);
      $document.on('mouseup', mouseup);
    });

    function mousemove(event) {

      if ($attrs.resizer == 'vertical') {
        // Handle vertical resizer
        var x = event.pageX;

        if ($attrs.resizerMin && x < $attrs.resizerMin) {
          x = parseInt($attrs.resizerMin);
        }
        if ($attrs.resizerMax && x > $attrs.resizerMax) {
          x = parseInt($attrs.resizerMax);
        }

        if ('moveWithParent' in $attrs)
          $element.css({ left: x + 'px' });

        if (resizerLeft) {
          resizerLeft.style.width = x + 'px';
        } if (resizerRight) {
          resizerRight.style.left = (x + parseInt($attrs.resizerWidth)) + 'px';
        }
      } else {
        // Handle horizontal resizer
        var y = window.innerHeight - event.pageY;

        if ('moveWithParent' in $attrs)
          $element.css({ bottom: y + 'px' });

        if (resizerTop) {
          resizerTop.style.bottom = (y + parseInt($attrs.resizerHeight)) + 'px';
        } if (resizerBottom) {
          resizerBottom.style.height = y + 'px';
        }
      }
    }

    function mouseup() {
      $document.unbind('mousemove', mousemove);
      $document.unbind('mouseup', mouseup);
    }
  };
}]);
