<?php
/**
 * Plugin Name: Affiliate Network
 * Plugin URI:  https://github.com/your-org/affiliate
 * Description: Bitcoin-settled affiliate payouts via Stacks smart contracts.
 * Version:     1.0.0
 * Author:      Affiliate Network
 * License:     MIT
 * Text Domain: affiliate-network
 */

defined('ABSPATH') || exit;

define('AFFILIATE_NETWORK_VERSION', '1.0.0');
define('AFFILIATE_NETWORK_PATH', plugin_dir_path(__FILE__));

require_once AFFILIATE_NETWORK_PATH . 'includes/class-affiliate-network.php';
require_once AFFILIATE_NETWORK_PATH . 'includes/class-affiliate-tracker.php';
require_once AFFILIATE_NETWORK_PATH . 'includes/class-oracle-client.php';
require_once AFFILIATE_NETWORK_PATH . 'includes/class-admin-settings.php';

function affiliate_network_init(): void {
    AffiliateNetwork::instance();
}
add_action('plugins_loaded', 'affiliate_network_init');
