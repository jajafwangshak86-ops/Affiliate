;; escrow.clar
;; Manages merchant funds, campaign configuration, and escrow thresholds.

;; ===== Traits =====

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ===== Constants =====

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INSUFFICIENT-AMOUNT (err u101))
(define-constant ERR-CAMPAIGN-NOT-FOUND (err u102))
(define-constant ERR-ESCROW-BELOW-FLOOR (err u103))
(define-constant ERR-CAMPAIGN-PAUSED (err u104))

(define-constant MIN-ESCROW-FLOOR u1000000) ;; 1 USDC (6 decimals)

;; ===== Data =====

(define-data-var next-campaign-id uint u1)

(define-map campaigns
  { campaign-id: uint }
  {
    merchant: principal,
    commission-rate: uint,   ;; basis points (e.g. 500 = 5%)
    escrow-balance: uint,
    escrow-floor: uint,
    token: principal,
    active: bool
  }
)

(define-map merchant-campaigns
  { merchant: principal }
  { campaign-ids: (list 50 uint) }
)

;; ===== Read-Only =====

(define-read-only (get-campaign (campaign-id uint))
  (map-get? campaigns { campaign-id: campaign-id })
)

(define-read-only (get-escrow-balance (campaign-id uint))
  (match (map-get? campaigns { campaign-id: campaign-id })
    campaign (ok (get escrow-balance campaign))
    ERR-CAMPAIGN-NOT-FOUND
  )
)

(define-read-only (is-campaign-active (campaign-id uint))
  (match (map-get? campaigns { campaign-id: campaign-id })
    campaign (ok (get active campaign))
    ERR-CAMPAIGN-NOT-FOUND
  )
)

;; ===== Public =====

;; Create a new campaign and set initial parameters
(define-public (create-campaign
    (commission-rate uint)
    (escrow-floor uint)
    (token principal))
  (let ((campaign-id (var-get next-campaign-id)))
    (map-set campaigns
      { campaign-id: campaign-id }
      {
        merchant: tx-sender,
        commission-rate: commission-rate,
        escrow-balance: u0,
        escrow-floor: (if (> escrow-floor MIN-ESCROW-FLOOR) escrow-floor MIN-ESCROW-FLOOR),
        token: token,
        active: false
      }
    )
    (var-set next-campaign-id (+ campaign-id u1))
    (ok campaign-id)
  )
)

;; Deposit funds into a campaign escrow
(define-public (deposit (campaign-id uint) (amount uint) (token <ft-trait>))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get merchant campaign)) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INSUFFICIENT-AMOUNT)
    (try! (as-contract (contract-call? token transfer amount tx-sender (as-contract tx-sender) none)))
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        escrow-balance: (+ (get escrow-balance campaign) amount),
        active: true
      })
    )
    (ok true)
  )
)

;; Update commission rate for a campaign
(define-public (set-commission-rate (campaign-id uint) (rate uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get merchant campaign)) ERR-NOT-AUTHORIZED)
    (asserts! (<= rate u10000) ERR-INSUFFICIENT-AMOUNT) ;; max 100%
    (map-set campaigns { campaign-id: campaign-id } (merge campaign { commission-rate: rate }))
    (ok true)
  )
)

;; Deduct payout from escrow - called only by payout contract
(define-public (deduct-escrow (campaign-id uint) (amount uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq contract-caller .payout) ERR-NOT-AUTHORIZED)
    (asserts! (get active campaign) ERR-CAMPAIGN-PAUSED)
    (let ((new-balance (- (get escrow-balance campaign) amount)))
      (map-set campaigns
        { campaign-id: campaign-id }
        (merge campaign {
          escrow-balance: new-balance,
          active: (>= new-balance (get escrow-floor campaign))
        })
      )
      (ok true)
    )
  )
)

;; Merchant withdraws remaining escrow
(define-public (withdraw (campaign-id uint) (amount uint) (token <ft-trait>))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get merchant campaign)) ERR-NOT-AUTHORIZED)
    (asserts! (<= amount (get escrow-balance campaign)) ERR-INSUFFICIENT-AMOUNT)
    (try! (as-contract (contract-call? token transfer amount tx-sender (get merchant campaign) none)))
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        escrow-balance: (- (get escrow-balance campaign) amount),
        active: false
      })
    )
    (ok true)
  )
)
