<?php
defined('ABSPATH') || exit;

class AdminSettings {
    public function __construct() {
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function add_menu(): void {
        add_options_page(
            'Affiliate Network',
            'Affiliate Network',
            'manage_options',
            'affiliate-network',
            [$this, 'render_page']
        );
    }

    public function register_settings(): void {
        $fields = [
            'affiliate_network_oracle_endpoint',
            'affiliate_network_campaign_id',
            'affiliate_network_merchant_pubkey',
            'affiliate_network_token_contract',
            'affiliate_network_private_key',
        ];
        foreach ($fields as $field) {
            register_setting('affiliate_network', $field);
        }
    }

    public function render_page(): void {
        ?>
        <div class="wrap">
            <h1>Affiliate Network Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('affiliate_network'); ?>
                <table class="form-table">
                    <tr><th>Oracle Endpoint</th><td>
                        <input type="url" name="affiliate_network_oracle_endpoint"
                            value="<?php echo esc_attr(get_option('affiliate_network_oracle_endpoint')); ?>" class="regular-text" />
                    </td></tr>
                    <tr><th>Campaign ID</th><td>
                        <input type="number" name="affiliate_network_campaign_id"
                            value="<?php echo esc_attr(get_option('affiliate_network_campaign_id')); ?>" />
                    </td></tr>
                    <tr><th>Merchant Pubkey</th><td>
                        <input type="text" name="affiliate_network_merchant_pubkey"
                            value="<?php echo esc_attr(get_option('affiliate_network_merchant_pubkey')); ?>" class="regular-text" />
                    </td></tr>
                    <tr><th>Token Contract</th><td>
                        <input type="text" name="affiliate_network_token_contract"
                            value="<?php echo esc_attr(get_option('affiliate_network_token_contract')); ?>" class="regular-text" />
                    </td></tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}

new AdminSettings();
