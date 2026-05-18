<?php
defined('ABSPATH') || exit;

class OracleClient {
    private string $endpoint;
    private string $merchant_pubkey;
    private string $private_key;
    private string $token_contract;

    public function __construct() {
        $this->endpoint       = get_option('affiliate_network_oracle_endpoint', '');
        $this->merchant_pubkey = get_option('affiliate_network_merchant_pubkey', '');
        $this->private_key    = get_option('affiliate_network_private_key', '');
        $this->token_contract = get_option('affiliate_network_token_contract', '');
    }

    public function submit_sale(
        string $sale_id,
        string $affiliate,
        int $campaign_id,
        int $amount,
        int $order_id
    ): void {
        $signature = $this->sign_payload($sale_id, $affiliate, $campaign_id, $amount);

        $payload = [
            'saleId'         => $sale_id,
            'affiliate'      => $affiliate,
            'campaignId'     => $campaign_id,
            'amount'         => $amount,
            'signature'      => $signature,
            'merchantPubkey' => $this->merchant_pubkey,
            'tokenContract'  => $this->token_contract,
        ];

        $response = wp_remote_post($this->endpoint . '/sale', [
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode($payload),
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            error_log('[AffiliateNetwork] Oracle error for order ' . $order_id . ': ' . $response->get_error_message());
        }
    }

    private function sign_payload(string $sale_id, string $affiliate, int $campaign_id, int $amount): string {
        $message = hash('sha256', $sale_id . $affiliate . $campaign_id . $amount, true);
        // In production, use a proper secp256k1 library (e.g., kornrunner/keccak + BitWasp)
        return hash_hmac('sha256', $message, $this->private_key);
    }
}
