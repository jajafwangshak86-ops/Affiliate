;; payout-v2.clar
;; Releases commissions to affiliates on verified oracle attestation - Clarity 3 mainnet compatible

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-INVALID-SIGNATURE (err u301))
(define-constant ERR-DUPLICATE-SALE (err u302))
(define-constant ERR-CAMPAIGN-INACTIVE (err u303))
(define-constant ERR-AFFILIATE-NOT-FOUND (err u304))
(define-constant ERR-INSUFFICIENT-ESCROW (err u305))
(define-constant ERR-AFFILIATE-INACTIVE (err u306))

(define-data-var oracle-pubkey (buff 33) 0x00)
(define-data-var payout-count uint u0)
(define-data-var total-paid-out uint u0)

(define-read-only (get-oracle-pubkey) (var-get oracle-pubkey))

(define-read-only (get-payout-stats)
  (ok { payout-count: (var-get payout-count), total-paid-out: (var-get total-paid-out) })
)

(define-read-only (recover-signer
    (sale-id (buff 32)) (affiliate principal) (campaign-id uint) (amount uint) (sig (buff 65)))
  (secp256k1-recover?
    (sha256 (concat sale-id (concat (unwrap-panic (to-consensus-buff? affiliate))
      (concat (unwrap-panic (to-consensus-buff? campaign-id))
              (unwrap-panic (to-consensus-buff? amount))))))
    sig
  )
)

(define-public (set-oracle-pubkey (pubkey (buff 33)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set oracle-pubkey pubkey)
    (ok true)
  )
)

;; token is first param for Clarity 3 trait call compatibility
(define-public (release-payout
    (token <ft-trait>)
    (sale-id (buff 32))
    (affiliate principal)
    (campaign-id uint)
    (amount uint)
    (sig (buff 65)))
  (begin
    (asserts! (not (contract-call? 'SP19PS42C7R7BR4VCX2YN8KPHXSB0ZC19K6PFEKTC.affiliate-v2 is-sale-processed sale-id)) ERR-DUPLICATE-SALE)
    (let ((affiliate-data (unwrap! (contract-call? 'SP19PS42C7R7BR4VCX2YN8KPHXSB0ZC19K6PFEKTC.affiliate-v2 get-affiliate affiliate) ERR-AFFILIATE-NOT-FOUND)))
      (asserts! (get active affiliate-data) ERR-AFFILIATE-INACTIVE)
    )
    (let ((recovered (unwrap! (recover-signer sale-id affiliate campaign-id amount sig) ERR-INVALID-SIGNATURE)))
      (asserts! (is-eq recovered (var-get oracle-pubkey)) ERR-INVALID-SIGNATURE)
    )
    (let ((campaign (unwrap! (contract-call? 'SP19PS42C7R7BR4VCX2YN8KPHXSB0ZC19K6PFEKTC.escrow-v2 get-campaign campaign-id) ERR-CAMPAIGN-INACTIVE)))
      (asserts! (get active campaign) ERR-CAMPAIGN-INACTIVE)
      (asserts! (>= (get escrow-balance campaign) amount) ERR-INSUFFICIENT-ESCROW)
      (try! (contract-call? 'SP19PS42C7R7BR4VCX2YN8KPHXSB0ZC19K6PFEKTC.escrow-v2 deduct-escrow campaign-id amount))
      (try! (contract-call? 'SP19PS42C7R7BR4VCX2YN8KPHXSB0ZC19K6PFEKTC.affiliate-v2 record-conversion affiliate sale-id campaign-id amount))
      (try! (as-contract (contract-call? token transfer amount tx-sender affiliate (some 0x00))))
      (var-set payout-count (+ (var-get payout-count) u1))
      (var-set total-paid-out (+ (var-get total-paid-out) amount))
      (ok true)
    )
  )
)
