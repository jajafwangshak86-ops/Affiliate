;; affiliate.clar
;; Handles affiliate registration, referral tracking, and conversion recording.

;; ===== Constants =====

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-ALREADY-REGISTERED (err u200))
(define-constant ERR-NOT-REGISTERED (err u201))
(define-constant ERR-NOT-AUTHORIZED (err u202))
(define-constant ERR-DUPLICATE-SALE (err u203))
(define-constant ERR-INVALID-ASSET (err u204))
(define-constant ERR-ALREADY-INACTIVE (err u205))

;; ===== Data =====

(define-map affiliates
  { affiliate: principal }
  {
    payout-asset: (string-ascii 4),  ;; "USDC" or "sBTC"
    total-conversions: uint,
    total-earned: uint,
    registered-at: uint,
    active: bool
  }
)

;; Tracks processed sale IDs to prevent replay
(define-map processed-sales
  { sale-id: (buff 32) }
  { affiliate: principal, campaign-id: uint, amount: uint, block: uint }
)

;; ===== Read-Only =====

(define-read-only (get-affiliate (affiliate principal))
  (map-get? affiliates { affiliate: affiliate })
)

(define-read-only (is-registered (affiliate principal))
  (is-some (map-get? affiliates { affiliate: affiliate }))
)

(define-read-only (get-conversion-count (affiliate principal))
  (match (map-get? affiliates { affiliate: affiliate })
    data (ok (get total-conversions data))
    (err u201)
  )
)

(define-read-only (get-total-earned (affiliate principal))
  (match (map-get? affiliates { affiliate: affiliate })
    data (ok (get total-earned data))
    (err u201)
  )
)

(define-read-only (get-sale (sale-id (buff 32)))
  (map-get? processed-sales { sale-id: sale-id })
)

(define-read-only (is-sale-processed (sale-id (buff 32)))
  (is-some (map-get? processed-sales { sale-id: sale-id }))
)

;; ===== Public =====

;; Register as an affiliate with preferred payout asset
(define-public (register (payout-asset (string-ascii 4)))
  (begin
    (asserts! (not (is-registered tx-sender)) ERR-ALREADY-REGISTERED)
    (asserts!
      (or (is-eq payout-asset "USDC") (is-eq payout-asset "sBTC"))
      ERR-INVALID-ASSET
    )
    (map-set affiliates
      { affiliate: tx-sender }
      {
        payout-asset: payout-asset,
        total-conversions: u0,
        total-earned: u0,
        registered-at: stacks-block-height,
        active: true
      }
    )
    (ok true)
  )
)

;; Update preferred payout asset
(define-public (set-payout-asset (payout-asset (string-ascii 4)))
  (let ((affiliate (unwrap! (map-get? affiliates { affiliate: tx-sender }) ERR-NOT-REGISTERED)))
    (asserts!
      (or (is-eq payout-asset "USDC") (is-eq payout-asset "sBTC"))
      ERR-INVALID-ASSET
    )
    (map-set affiliates
      { affiliate: tx-sender }
      (merge affiliate { payout-asset: payout-asset })
    )
    (ok true)
  )
)

;; Deactivate own affiliate account
(define-public (deactivate)
  (let ((affiliate (unwrap! (map-get? affiliates { affiliate: tx-sender }) ERR-NOT-REGISTERED)))
    (asserts! (get active affiliate) ERR-ALREADY-INACTIVE)
    (map-set affiliates
      { affiliate: tx-sender }
      (merge affiliate { active: false })
    )
    (ok true)
  )
)

;; Record a verified conversion - called only by payout contract
(define-public (record-conversion
    (affiliate principal)
    (sale-id (buff 32))
    (campaign-id uint)
    (amount uint))
  (let ((affiliate-data (unwrap! (map-get? affiliates { affiliate: affiliate }) ERR-NOT-REGISTERED)))
    (asserts! (is-eq contract-caller .payout) ERR-NOT-AUTHORIZED)
    (asserts! (not (is-sale-processed sale-id)) ERR-DUPLICATE-SALE)
    (map-set processed-sales
      { sale-id: sale-id }
      { affiliate: affiliate, campaign-id: campaign-id, amount: amount, block: stacks-block-height }
    )
    (map-set affiliates
      { affiliate: affiliate }
      (merge affiliate-data {
        total-conversions: (+ (get total-conversions affiliate-data) u1),
        total-earned: (+ (get total-earned affiliate-data) amount)
      })
    )
    (ok true)
  )
)
