;; payout.clar
;; Releases commissions to affiliates upon receiving a valid oracle attestation.

;; ===== Traits =====

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ===== Constants =====

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-INVALID-SIGNATURE (err u301))
(define-constant ERR-DUPLICATE-SALE (err u302))
(define-constant ERR-CAMPAIGN-INACTIVE (err u303))
(define-constant ERR-AFFILIATE-NOT-FOUND (err u304))
(define-constant ERR-INSUFFICIENT-ESCROW (err u305))
(define-constant ERR-AFFILIATE-INACTIVE (err u306))

;; ===== Data =====

(define-data-var oracle-pubkey (buff 33) 0x00)
(define-data-var payout-count uint u0)
(define-data-var total-paid-out uint u0)

;; ===== Read-Only =====

(define-read-only (get-oracle-pubkey)
  (var-get oracle-pubkey)
)

(define-read-only (get-payout-stats)
  (ok {
    payout-count: (var-get payout-count),
    total-paid-out: (var-get total-paid-out)
  })
)

;; Recover signer from a sale attestation
;; Message: sha256(sale-id | to-consensus-buff?(affiliate) | to-consensus-buff?(campaign-id) | to-consensus-buff?(amount))
(define-read-only (recover-signer
    (sale-id (buff 32))
    (affiliate principal)
    (campaign-id uint)
    (amount uint)
    (sig (buff 65)))
  (secp256k1-recover?
    (sha256 (concat sale-id (concat (unwrap-panic (to-consensus-buff? affiliate))
      (concat (unwrap-panic (to-consensus-buff? campaign-id))
              (unwrap-panic (to-consensus-buff? amount))))))
    sig
  )
)

;; ===== Admin =====

(define-public (set-oracle-pubkey (pubkey (buff 33)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set oracle-pubkey pubkey)
    (ok true)
  )
)

;; ===== Public =====

;; Release payout to affiliate on verified oracle attestation
(define-public (release-payout
    (sale-id (buff 32))
    (affiliate principal)
    (campaign-id uint)
    (amount uint)
    (sig (buff 65))
    (token <ft-trait>))
  (begin
    ;; Prevent replay
    (asserts! (not (contract-call? .affiliate is-sale-processed sale-id)) ERR-DUPLICATE-SALE)

    ;; Verify affiliate is registered and active
    (let ((affiliate-data (unwrap! (contract-call? .affiliate get-affiliate affiliate) ERR-AFFILIATE-NOT-FOUND)))
      (asserts! (get active affiliate-data) ERR-AFFILIATE-INACTIVE)
    )

    ;; Verify oracle signature
    (let ((recovered (unwrap! (recover-signer sale-id affiliate campaign-id amount sig) ERR-INVALID-SIGNATURE)))
      (asserts! (is-eq recovered (var-get oracle-pubkey)) ERR-INVALID-SIGNATURE)
    )

    ;; Verify campaign is active and has sufficient escrow
    (let ((campaign (unwrap! (contract-call? .escrow get-campaign campaign-id) ERR-CAMPAIGN-INACTIVE)))
      (asserts! (get active campaign) ERR-CAMPAIGN-INACTIVE)
      (asserts! (>= (get escrow-balance campaign) amount) ERR-INSUFFICIENT-ESCROW)

      ;; Deduct from escrow
      (try! (contract-call? .escrow deduct-escrow campaign-id amount))

      ;; Record conversion on affiliate contract
      (try! (contract-call? .affiliate record-conversion affiliate sale-id campaign-id amount))

      ;; Transfer payout to affiliate
      (try! (as-contract (contract-call? token transfer amount tx-sender affiliate none)))

      ;; Update global stats
      (var-set payout-count (+ (var-get payout-count) u1))
      (var-set total-paid-out (+ (var-get total-paid-out) amount))

      (ok true)
    )
  )
)
