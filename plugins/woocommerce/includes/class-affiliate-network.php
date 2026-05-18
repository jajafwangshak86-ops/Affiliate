<?php
defined('ABSPATH') || exit;

class AffiliateNetwork {
    private static ?AffiliateNetwork $instance = null;

    public static function instance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('woocommerce_order_status_completed', [$this, 'on_order_complete']);
        add_action('init', [$this, 'capture_referral']);
    }

    public function capture_referral(): void {
        if (!empty($_GET['ref'])) {
            $affiliate = sanitize_text_field($_GET['ref']);
            setcookie('affiliate_ref', $affiliate, time() + (30 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN);
        }
    }

    public function on_order_complete(int $order_id): void {
        $affiliate = $_COOKIE['affiliate_ref'] ?? null;
        if (!$affiliate) return;

        $order    = wc_get_order($order_id);
        $campaign = get_option('affiliate_network_campaign_id');
        $amount   = (int) round((float) $order->get_total() * 100); // cents

        $sale_id = hash('sha256', $order_id . $affiliate . time());

        $client = new OracleClient();
        $client->submit_sale($sale_id, $affiliate, (int) $campaign, $amount, $order_id);
    }
}
