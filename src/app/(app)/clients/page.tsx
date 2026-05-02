'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'
import { ClientFormModal } from '@/components/clients/ClientFormModal'

type Client = {
  id: string
  name: string
  pic_name: string | null
  pic_email: string | null
  created_at: string
  invoice_count: number
}

type ToastState = { message: string; type: 'error' | 'success' } | null

/* ─── Confirm delete dialog ─────────────────────────────────── */
function ConfirmDialog({
  clientName,
  onConfirm,
  onCancel,
}: {
  clientName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-dark-charcoal/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl border border-border shadow-2xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-primary-dark mb-2">Hapus klien?</h3>
        <p className="text-sm text-medium-gray mb-6">
          <strong>{clientName}</strong> akan dihapus. Invoice yang sudah dibuat tetap tersimpan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-border text-medium-gray font-semibold text-sm py-2.5 rounded-xl hover:border-primary-teal transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-error text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-error/90 transition-all"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function ClientsPage() {
  const [clients,      setClients]      = useState<Client[]>([])
  const [search,       setSearch]       = useState('')
  const [loading,      setLoading]      = useState(true)
  const [plan,         setPlan]         = useState<string>('free')
  const [toast,        setToast]        = useState<ToastState>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [modalClientId, setModalClientId] = useState<string | null | undefined>(undefined)
  // undefined = closed, null = new, string = edit
  const [tourMode, setTourMode] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profileData }, { data: clientsData }, { data: invData }] = await Promise.all([
      supabase.from('users').select('plan').eq('id', user.id).single(),
      supabase
        .from('clients')
        .select('id, name, pic_name, pic_email, created_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('name'),
      supabase
        .from('invoices')
        .select('client_id')
        .eq('user_id', user.id)
        .is('deleted_at', null),
    ])

    setPlan(profileData?.plan ?? 'free')

    const countMap: Record<string, number> = {}
    invData?.forEach(inv => {
      if (inv.client_id) countMap[inv.client_id] = (countMap[inv.client_id] ?? 0) + 1
    })

    setClients(
      (clientsData ?? []).map(c => ({ ...c, invoice_count: countMap[c.id] ?? 0 })),
    )
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  /* Auto-open modal in tour mode when ?tour=1 is in the URL */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tour') === '1') {
      setTourMode(true)
      setModalClientId(null)
    }
  }, [])

  async function handleDelete(client: Client) {
    const supabase = createClient()
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', client.id)

    setDeleteTarget(null)
    if (error) {
      setToast({ message: 'Gagal menghapus klien. Coba lagi.', type: 'error' })
    } else {
      setToast({ message: `${client.name} berhasil dihapus.`, type: 'success' })
      setClients(prev => prev.filter(c => c.id !== client.id))
    }
  }

  function handleModalSaved(id: string) {
    setModalClientId(undefined)
    setTourMode(false)
    if (id === 'deleted') {
      setToast({ message: 'Klien berhasil dihapus.', type: 'success' })
    } else if (modalClientId === null) {
      setToast({ message: 'Klien berhasil ditambahkan.', type: 'success' })
    } else {
      setToast({ message: 'Perubahan berhasil disimpan.', type: 'success' })
    }
    load()
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.pic_name?.toLowerCase() ?? '').includes(q) ||
      (c.pic_email?.toLowerCase() ?? '').includes(q)
    )
  })

  const isFree = plan === 'free'
  const atLimit = isFree && clients.length >= 3
  const canAdd  = !atLimit

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-dark">Klien</h1>
          <p className="text-sm text-medium-gray mt-0.5">
            {clients.length} klien tersimpan
            {isFree && ` · ${clients.length}/3 (Free)`}
          </p>
        </div>
        {canAdd ? (
          <button
            type="button"
            onClick={() => setModalClientId(null)}
            className="inline-flex items-center gap-2 bg-primary-teal text-white font-semibold
                       text-sm px-5 py-2.5 rounded-xl hover:bg-primary-teal/90 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Tambah Klien
          </button>
        ) : (
          <div className="text-right">
            <p className="text-xs text-error font-medium">Batas 3 klien (Free) tercapai.</p>
            <Link href="/settings/billing" className="text-xs text-primary-teal font-semibold hover:underline">
              Upgrade ke Pro →
            </Link>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-gray" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
        </svg>
        <input
          type="text"
          placeholder="Cari nama, PIC, atau email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm
                     text-primary-dark placeholder:text-light-gray outline-none
                     focus:border-primary-teal transition-colors bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-primary-teal border-t-transparent animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-medium-gray text-sm">
              {search ? `Tidak ada klien yang cocok dengan "${search}".` : 'Belum ada klien. Tambahkan yang pertama!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-very-light-gray/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">Nama</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider hidden sm:table-cell">Email PIC</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider hidden md:table-cell">Invoice</th>
                  <th className="px-6 py-3"/>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(client => (
                  <tr key={client.id} className="hover:bg-very-light-gray/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-primary-dark">{client.name}</p>
                      {client.pic_name && (
                        <p className="text-xs text-light-gray mt-0.5">{client.pic_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-medium-gray hidden sm:table-cell">
                      {client.pic_email ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-center hidden md:table-cell">
                      <span className="text-medium-gray font-medium">{client.invoice_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModalClientId(client.id)}
                          className="text-xs font-semibold text-primary-teal hover:underline px-3 py-1.5 rounded-lg hover:bg-subtle-teal transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(client)}
                          className="text-xs font-semibold text-light-gray hover:text-error px-3 py-1.5 rounded-lg hover:bg-error/5 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm delete */}
      {deleteTarget && (
        <ConfirmDialog
          clientName={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {modalClientId !== undefined && (
        <ClientFormModal
          clientId={modalClientId}
          onClose={() => { setModalClientId(undefined); setTourMode(false) }}
          onSaved={handleModalSaved}
          tourMode={tourMode}
        />
      )}
    </div>
  )
}
