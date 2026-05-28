;; escrow-v2.clar
;; Merchant escrow and campaign management - Clarity 3 mainnet compatible

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INSUFFICIENT-AMOUNT (err u101))
(define-constant ERR-CAMPAIGN-NOT-FOUND (err u102))
(define-constant ERR-ESCROW-BELOW-FLOOR (err u103))
(define-constant ERR-CAMPAIGN-PAUSED (err u104))
(define-constant ERR-CAMPAIGN-ALREADY-ACTIVE (err u105))
(define-constant ERR-CAMPAIGN-ALREADY-PAUSED (err u106))
(define-constant ERR-INSUFFICIENT-BALANCE (err u107))
(define-constant MIN-ESCROW-FLOOR u1000000)

(define-data-var next-campaign-id uint u1)

(define-map campaigns
  { campaign-id: uint }
  {
    merchant: principal,
    commission-rate: uint,
    escrow-balance: uint,
    escrow-floor: uint,
    token: principal,
    active: bool
  }
)

(define-read-only (get-campaign (campaign-id uint))
  (map-get? campaigns { campaign-id: campaign-id })
)

(define-read-only (get-next-campaign-id)
  (var-get next-campaign-id)
)

(define-read-only (get-commission-rate (campaign-id uint))
  (match (map-get? campaigns { campaign-id: campaign-id })
    campaign (ok (get commission-rate campaign))
    ERR-CAMPAIGN-NOT-FOUND
  )
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

(define-public (create-campaign (commission-rate uint) (escrow-floor uint) (token principal))
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

;; Deposit: token is first param for Clarity 3 trait call compatibility
(define-public (deposit (token <ft-trait>) (campaign-id uint) (amount uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get merchant campaign)) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INSUFFICIENT-AMOUNT)
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) (some 0x00)))
    (map-set campaigns { campaign-id: campaign-id }
      (merge campaign { escrow-balance: (+ (get escrow-balance campaign) amount), active: true }))
    (ok true)
  )
)

(define-public (set-commission-rate (campaign-id uint) (rate uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get merchant campaign)) ERR-NOT-AUTHORIZED)
    (asserts! (<= rate u10000) ERR-INSUFFICIENT-AMOUNT)
    (map-set campaigns { campaign-id: campaign-id } (merge campaign { commission-rate: rate }))
    (ok true)
  )
)

(define-public (update-escrow-floor (campaign-id uint) (new-floor uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get merchant campaign)) ERR-NOT-AUTHORIZED)
    (asserts! (>= new-floor MIN-ESCROW-FLOOR) ERR-INSUFFICIENT-AMOUNT)
    (map-set campaigns { campaign-id: campaign-id } (merge campaign { escrow-floor: new-floor }))
    (ok true)
  )
)

(define-public (pause-campaign (campaign-id uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get merchant campaign)) ERR-NOT-AUTHORIZED)
    (asserts! (get active campaign) ERR-CAMPAIGN-ALREADY-PAUSED)
    (map-set campaigns { campaign-id: campaign-id } (merge campaign { active: false }))
    (ok true)
  )
)

(define-public (resume-campaign (campaign-id uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get merchant campaign)) ERR-NOT-AUTHORIZED)
    (asserts! (not (get active campaign)) ERR-CAMPAIGN-ALREADY-ACTIVE)
    (asserts! (>= (get escrow-balance campaign) (get escrow-floor campaign)) ERR-ESCROW-BELOW-FLOOR)
    (map-set campaigns { campaign-id: campaign-id } (merge campaign { active: true }))
    (ok true)
  )
)

(define-public (deduct-escrow (campaign-id uint) (amount uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq contract-caller 'SP19PS42C7R7BR4VCX2YN8KPHXSB0ZC19K6PFEKTC.payout-v2) ERR-NOT-AUTHORIZED)
    (asserts! (get active campaign) ERR-CAMPAIGN-PAUSED)
    (asserts! (>= (get escrow-balance campaign) amount) ERR-INSUFFICIENT-BALANCE)
    (let ((new-balance (- (get escrow-balance campaign) amount)))
      (map-set campaigns { campaign-id: campaign-id }
        (merge campaign {
          escrow-balance: new-balance,
          active: (>= new-balance (get escrow-floor campaign))
        }))
      (ok true)
    )
  )
)

;; Withdraw: token is first param for Clarity 3 trait call compatibility
(define-public (withdraw (token <ft-trait>) (campaign-id uint) (amount uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get merchant campaign)) ERR-NOT-AUTHORIZED)
    (asserts! (<= amount (get escrow-balance campaign)) ERR-INSUFFICIENT-AMOUNT)
    (try! (as-contract (contract-call? token transfer amount tx-sender (get merchant campaign) (some 0x00))))
    (map-set campaigns { campaign-id: campaign-id }
      (merge campaign { escrow-balance: (- (get escrow-balance campaign) amount), active: false }))
    (ok true)
  )
)
