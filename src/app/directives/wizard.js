angular.module('proton.wizard', [])
.directive('displayWizardButton', ($rootScope) => ({
    link(scope, el, { displayWizardButton, displayPosition }) {
    /**
     * Emit an action on click with its name and the position you passed through
     * the attribute [data-display-position]
     */
        const onClick = () => $rootScope.$emit('tourActions', {
            action: displayWizardButton || 'tourStart',
            position: +displayPosition
        });
        el.on('click', onClick);

        scope
      .$on('$destroy', () => {
          el.off('click', onClick);
      });
    }
}))
.directive('wizard', ($rootScope, $timeout, $state, welcomeModal, donateModal, $window, Payment, notify, gettextCatalog, wizardBuilder) => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/partials/wizard.tpl.html',
        link(scope, element) {

            const welcome = function () {
                welcomeModal.activate({
                    params: {
                        cancel() {
                            welcomeModal.deactivate();
                        },
                        next() {
                            welcomeModal.deactivate();
              // Start tour
                            tourStart();
                        }
                    }
                });
            };

      // Initialization
            $timeout(() => {
                if ($rootScope.welcome === true) {
                    $rootScope.welcome = false;
                    welcome();
                }
            }, 0);

              /**
               * Listen to the differents actions
               *   - touchStart: Display the wizard
               *   - touchEnd: Close the wizard
               *   - touchNext: Display the next slide
               *   - touchGo: Going to a slide by its position
               */
            const unsubscribe = $rootScope.$on('tourActions', (e, { action, position }) => {
                (action === 'tourStart') && tourStart();
                (action === 'tourEnd') && tourEnd();
                (action === 'tourNext') && tourNext();
                (action === 'tourGo') && tourGo(position);
            });

            scope.$on('$destroy', unsubscribe);

      /**
       * Action with left and right arrows
       * @param  {Number} options.keyCode
       */
            const onKeydown = ({ keyCode }) => {
                (keyCode === 37) && tourPrev(); // Left arrow
                (keyCode === 39) && tourNext(); // Right arrow
            };

      /**
       * Bind a className by step to the directive in order to hide and display slides
       * @param  {Number} step
       */
            function switchActiveClassName(step) {
                element[0].className = element[0].className.replace(/wizardStep-\d{1}/, `wizardStep-${step}`);
            }

            element.on('keydown', onKeydown);

            function tourStart() {
                $state.go('secured.inbox');
                scope
          .$applyAsync(() => {
              $rootScope.tourActive = true; // used for body class and CSS.
              element[0].classList.remove('wizardStep-hidden'); // Display the wizard
              $timeout(() => element[0].focus(), 0, false); // Prevent $digest
          });

                tourGo(1);
            }

            function tourEnd() {
                element[0].classList.add('wizardStep-hidden'); // Hide the wizard
                scope
          .$applyAsync(() => {
              $rootScope.tourActive = false;
              wizardBuilder.hideTooltips();
          });
            }

            function tourNext() {
                if (scope.tourStep !== 4) {
                    tourGo(Number(scope.tourStep + 1));
                }
            }

            function tourPrev() {
                if (scope.tourStep > 1) {
                    tourGo(Number(scope.tourStep - 1));
                }
            }

            function tourGo(step) {

                wizardBuilder
          .hideTooltips()
          .tooltip('destroy');

                scope
          .$applyAsync(() => {
              scope.tourStep = step;
              wizardBuilder.renderTooltips(step);
              switchActiveClassName(step);
          });
            }
        }
    };
})
.factory('wizardBuilder', () => {
    const hideTooltips = () => $('.tooltip').tooltip('hide');

    const loadTooltips = (step) => {
        let tooltips = [];

        switch (step) {
            case 2:
                $('#tour-layout').tooltip({
                    title: '1',
                    placement: 'left',
                    trigger: 'manual'
                });
                $('#tour-settings').tooltip({
                    title: '2',
                    placement: 'left',
                    trigger: 'manual'
                });
                tooltips = ['#tour-layout', '#tour-settings'];
                break;
            case 3:
                $('#tour-label-dropdown').tooltip({
                    title: '1',
                    placement: 'bottom',
                    trigger: 'manual'
                });
                $('#tour-label-settings').tooltip({
                    title: '2',
                    placement: 'right',
                    trigger: 'manual'
                });
                tooltips = ['#tour-label-dropdown', '#tour-label-settings'];
                break;
            case 4:
                $('#tour-support').tooltip({
                    title: '1',
                    placement: 'left',
                    trigger: 'manual'
                });
                tooltips = ['#tour-support'];
                break;
            default:
                break;
        }

        return tooltips;
    };

    const renderTooltips = (step) => {
        const id = setTimeout(() => {
            $(loadTooltips(step)).tooltip('show');
            $('.tooltip:visible').addClass('tour');
            clearTimeout(id);
        });
    };

    return { hideTooltips, renderTooltips };
});
