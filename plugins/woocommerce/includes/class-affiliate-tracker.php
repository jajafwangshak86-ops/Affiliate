<?php
defined('ABSPATH') || exit;

class AffiliateTracker {
    public static function get_referral(): ?string {
        return $_COOKIE['affiliate_ref'] ?? null;
    }

    public static function clear_referral(): void {
        setcookie('affiliate_ref', '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN);
    }
}
