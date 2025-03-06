$(document).ready(function() {
    // Add staggered fade-in animation to elements on page load
    function animateElements() {
        const elements = [
            '.content-card h1',
            '.subtitle',
            '.filter-section',
            '.table-card'
        ];
        
        elements.forEach((selector, index) => {
            $(selector).css({
                'opacity': '0',
                'transform': 'translateY(20px)'
            });
            
            setTimeout(() => {
                $(selector).css({
                    'transition': 'opacity 0.5s ease, transform 0.5s ease',
                    'opacity': '1',
                    'transform': 'translateY(0)'
                });
            }, 100 * (index + 1));
        });
    }
    
    // Call animation function once loader is hidden
    const originalFadeOut = $.fn.fadeOut;
    $.fn.fadeOut = function() {
        if (this.attr('id') === 'loader') {
            originalFadeOut.apply(this, arguments);
            setTimeout(animateElements, 200);
        } else {
            originalFadeOut.apply(this, arguments);
        }
        return this;
    };
    
    // Add hover effects to table rows
    $(document).on('mouseenter', '#resultTable tbody tr', function() {
        $(this).css('transform', 'translateX(5px)');
    }).on('mouseleave', '#resultTable tbody tr', function() {
        $(this).css('transform', 'translateX(0)');
    });
    
    // Add button hover animation
    $('.btn').hover(
        function() {
            $(this).find('.btn-text').css('transform', 'translateY(-2px)');
        },
        function() {
            $(this).find('.btn-text').css('transform', 'translateY(0)');
        }
    );
    
    // Enhance modal animations
    $(document).on('show.bs.modal', '#areaModal', function() {
        // Set initial state
        const $modal = $(this);
        const $modalDialog = $modal.find('.modal-dialog');
        const $modalContent = $modal.find('.modal-content');
        
        $modalDialog.css({
            'transform': 'scale(0.8)',
            'opacity': '0'
        });
        
        // Create blur shadow effect behind modal
        if ($('#modal-backdrop').length === 0) {
            $('body').append('<div id="modal-backdrop" style="position: fixed; top: 50%; left: 50%; width: 100px; height: 100px; transform: translate(-50%, -50%) scale(0); border-radius: 50%; background: radial-gradient(circle, rgba(75, 108, 183, 0.2) 0%, rgba(75, 108, 183, 0) 70%); z-index: 1050; pointer-events: none;"></div>');
        }
        
        // Animate backdrop and modal
        setTimeout(() => {
            $('#modal-backdrop').css({
                'transition': 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'transform': 'translate(-50%, -50%) scale(12)'
            });
            
            $modalDialog.css({
                'transition': 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'transform': 'scale(1)',
                'opacity': '1'
            });
        }, 10);
    });
    
    $(document).on('hide.bs.modal', '#areaModal', function() {
        const $modalDialog = $(this).find('.modal-dialog');
        
        $modalDialog.css({
            'transition': 'all 0.3s ease',
            'transform': 'scale(0.8)',
            'opacity': '0'
        });
        
        $('#modal-backdrop').css({
            'transition': 'transform 0.4s ease',
            'transform': 'translate(-50%, -50%) scale(0)'
        });
    });
    
    // Enhance the table sorting animation
    $(document).on('click', '#resultTable th', function() {
        // Add flash animation to cells when sorting
        $('#resultTable tbody td').css({
            'transition': 'background-color 0.3s ease'
        });
        
        $('#resultTable tbody td').addClass('sorting-flash');
        
        setTimeout(() => {
            $('#resultTable tbody td').removeClass('sorting-flash');
        }, 500);
    });
    
    // Add css for sorting flash animation
    $("<style>")
        .prop("type", "text/css")
        .html(`
            .sorting-flash {
                background-color: rgba(75, 108, 183, 0.05) !important;
            }
            
            #resultTable tbody tr {
                transition: transform 0.3s ease;
            }
            
            .btn-text {
                display: inline-block;
                transition: transform 0.3s ease;
            }
            
            @keyframes tableRowEnter {
                from { opacity: 0; transform: translateX(10px); }
                to { opacity: 1; transform: translateX(0); }
            }
            
            .modal-content {
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
        `)
        .appendTo("head");
    
    // Add title hover effect
    $('h1').hover(
        function() {
            $(this).css({
                'transform': 'scale(1.02)',
                'transition': 'transform 0.3s ease'
            });
        },
        function() {
            $(this).css({
                'transform': 'scale(1)',
                'transition': 'transform 0.3s ease'
            });
        }
    );
    
    // Add subtle pulse to filter section
    setTimeout(() => {
        $('.filter-section').css({
            'transition': 'box-shadow 0.4s ease',
            'box-shadow': '0 5px 15px rgba(75, 108, 183, 0.1)'
        });
        
        setTimeout(() => {
            $('.filter-section').css({
                'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.05)'
            });
        }, 800);
    }, 1500);
    
    // Add animation to modal table when opening modal
    $(document).on('shown.bs.modal', '#areaModal', function() {
        const $rows = $(this).find('#modalLanguagesTable tbody tr');
        
        $rows.css({
            'opacity': '0',
            'transform': 'translateY(10px)'
        });
        
        $rows.each(function(index) {
            setTimeout(() => {
                $(this).css({
                    'transition': 'all 0.3s ease',
                    'opacity': '1',
                    'transform': 'translateY(0)'
                });
            }, 50 * (index + 1));
        });
    });
    
    // Add animation to the language percentages in the modal
    $(document).on('shown.bs.modal', '#areaModal', function() {
        setTimeout(() => {
            $('#modalLanguagesTable tbody tr').each(function() {
                const $percentageCell = $(this).find('td:last-child');
                const percentText = $percentageCell.text();
                const percentValue = parseFloat(percentText);
                
                // Create a gradient background based on the percentage
                const gradient = `linear-gradient(90deg, 
                    rgba(75, 108, 183, 0.2) 0%, 
                    rgba(75, 108, 183, 0.2) ${percentValue}%, 
                    transparent ${percentValue}%, 
                    transparent 100%)`;
                
                $percentageCell.css({
                    'background': gradient,
                    'transition': 'background 1s ease'
                });
            });
        }, 300);
    });
});