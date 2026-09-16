'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { actionUpdateDealStatus } from '@/actions/listings'
import type { DealStatus } from '@/types'
import { cn } from '@/lib/utils'

interface DealStatusActionsProps {
  dealId: string
  status: DealStatus
  isAdmin?: boolean
  canSellerAct?: boolean
  canBuyerAct?: boolean
}

/**
 * Status controls for deal participants and admins.
 */
export const DealStatusActions = ({
  dealId,
  status,
  isAdmin = false,
  canSellerAct = false,
  canBuyerAct = false,
}: DealStatusActionsProps) => {
  const router = useRouter()
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * Applies a status change and refreshes the view.
   * @param next - Next deal status
   */
  const update = async (next: DealStatus) => {
    setLoading(true)
    await actionUpdateDealStatus(dealId, next, isAdmin ? adminNotes : undefined)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canSellerAct && status === 'pending' ? (
          <>
            <ActionButton disabled={loading} onClick={() => update('accepted')} label="Accept" />
            <ActionButton disabled={loading} onClick={() => update('rejected')} label="Reject" tone="muted" />
          </>
        ) : null}
        {(canSellerAct || canBuyerAct) && (status === 'accepted' || status === 'in_progress') ? (
          <>
            <ActionButton
              disabled={loading}
              onClick={() => update('in_progress')}
              label="Mark in progress"
              tone="muted"
            />
            <ActionButton
              disabled={loading}
              onClick={() => update('completed')}
              label="Complete deal"
            />
          </>
        ) : null}
        {(canSellerAct || canBuyerAct) && status !== 'completed' && status !== 'cancelled' ? (
          <ActionButton
            disabled={loading}
            onClick={() => update('cancelled')}
            label="Cancel"
            tone="muted"
          />
        ) : null}
        {isAdmin ? (
          <ActionButton
            disabled={loading}
            onClick={() => update('completed')}
            label="Admin: force complete"
          />
        ) : null}
      </div>
      {isAdmin ? (
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-teal-900/15 bg-white px-3 py-2 text-sm"
          placeholder="Admin notes (saved on next status update)"
        />
      ) : null}
    </div>
  )
}

interface ActionButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'primary' | 'muted'
}

/**
 * Compact action button for deal workflows.
 */
const ActionButton = ({
  label,
  onClick,
  disabled,
  tone = 'primary',
}: ActionButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-sm disabled:opacity-60',
        tone === 'primary'
          ? 'bg-teal-800 text-[#f7f3eb] hover:bg-teal-900'
          : 'border border-teal-900/20 text-teal-950 hover:bg-teal-900/5'
      )}
    >
      {label}
    </button>
  )
}
