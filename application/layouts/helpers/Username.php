<?php
/**
 * @copyright Bluz PHP Team
 * @link https://github.com/bluzphp/skeleton
 */

/**
 * @namespace
 */
namespace Application\Layout\Helper;

return
/**
 * Get current user name
 *
 * @var \Application\Users\Row $user
 * @return string
 */
function () {
    if ($user = app()->user()) {
        return $user->login;
    } else {
        return __('Guest');
    }
};
