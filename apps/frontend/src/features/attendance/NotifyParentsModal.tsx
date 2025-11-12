import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useMemo } from 'react'
import type { PreparedNotification } from './types'

interface NotifyParentsModalProps {
  open: boolean
  onClose: () => void
  notifications: PreparedNotification[]
  senderNumber: string
  recipientOverride?: string
}

export const NotifyParentsModal = ({
  open,
  onClose,
  notifications,
  senderNumber,
  recipientOverride
}: NotifyParentsModalProps) => {
  const csvHref = useMemo(() => {
    if (!notifications.length) return null
    const header = ['Type', 'Student Name', 'Roll Number', 'Parent Phone', 'Message']
    const rows = notifications.map((item) =>
      [
        item.type,
        escapeCsv(item.studentName),
        escapeCsv(item.rollNumber),
        item.parentPhone,
        escapeCsv(item.message)
      ].join(',')
    )
    const csv = [header.join(','), ...rows].join('\n')
    return URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  }, [notifications])

  const handleShareAll = async () => {
    if (!('share' in navigator) || !notifications.length) return
    await navigator.share({
      title: 'CollegeAttend Parent Notices',
      text: notifications.map((note) => note.message).join('\n\n')
    })
  }

  const handleOpenAll = () => {
    if (!notifications.length) return
    const confirmBatch = window.confirm(
      `Open ${notifications.length} WhatsApp tabs to send messages?`
    )
    if (!confirmBatch) {
      return
    }
    notifications.forEach((notification, index) => {
      const url = buildWhatsAppUrl(notification.parentPhone, notification.message)
      window.setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer')
      }, index * 150)
    })
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Notify Parents (WhatsApp)
                </Dialog.Title>
                <p className="mt-1 text-xs text-slate-500">
                  Teachers confirm sending. CollegeAttend never sends messages automatically. Use the
                  official sender{' '}
                  <span className="font-semibold text-primary">{senderNumber}</span> in WhatsApp.{' '}
                  {recipientOverride?.trim()
                    ? ` All prepared links use ${recipientOverride.trim()} as the recipient.`
                    : 'Recipient numbers default to each student’s parent contact.'}
                </p>

                <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      Select one or more students marked Absent or High Risk to prepare messages.
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <article
                        key={`${notification.type}-${notification.parentPhone}-${notification.studentName}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {notification.studentName}{' '}
                              {notification.rollNumber
                                ? `(Roll ${notification.rollNumber})`
                                : ''}
                            </p>
                            <p className="text-xs text-slate-500">
                              WhatsApp recipient: {notification.parentPhone}
                            </p>
                            <span
                              className={`mt-1 inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                notification.type === 'absence'
                                  ? 'bg-danger/10 text-danger'
                                  : 'bg-warning/10 text-warning'
                              }`}
                            >
                              {notification.type === 'absence'
                                ? 'Absent notification'
                                : 'Predicted high-risk alert'}
                            </span>
                          </div>
                          <a
                            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={buildWhatsAppUrl(notification.parentPhone, notification.message)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open WhatsApp
                          </a>
                        </div>
                        <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-700 shadow-inner">
                          {notification.message}
                        </p>
                      </article>
                    ))
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleOpenAll}
                      className="rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:border-slate-200 disabled:text-slate-400"
                      disabled={!notifications.length}
                    >
                      Open selected in WhatsApp
                    </button>
                    {'share' in navigator ? (
                      <button
                        type="button"
                        onClick={() => void handleShareAll()}
                        className="rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:border-slate-200 disabled:text-slate-400"
                        disabled={!notifications.length}
                      >
                        Share batch via Web Share
                      </button>
                    ) : null}
                    {csvHref ? (
                      <a
                        href={csvHref}
                        download="collegeattend_whatsapp_messages.csv"
                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        Download CSV
                      </a>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

const buildWhatsAppUrl = (phone: string, message: string) => {
  const sanitized = phone.replace(/[^\d+]/g, '')
  return `https://wa.me/${encodeURIComponent(sanitized)}?text=${encodeURIComponent(message)}`
}

const escapeCsv = (value: string) => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

