import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, TrendingDown, Clock, Filter, Search, ChevronLeft, ChevronRight,
  AlertCircle, Receipt, ArrowDownUp,
} from 'lucide-react'
import { transactions, type Transaction } from '@/lib/api'
import { formatCurrency, formatPercent, cnColor } from '@/lib/utils'

const PAGE_SIZE = 15

const typeFilters = [
  { value: '', label: 'All', icon: ArrowDownUp },
  { value: 'buy', label: 'Buy', icon: TrendingUp },
  { value: 'sell', label: 'Sell', icon: TrendingDown },
] as const

// ── Skeleton ────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="skeleton h-5 w-24 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skeleton h-12 w-full" style={{ opacity: 1 - i * 0.08 }} />
        ))}
      </div>
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────────────────
function EmptyTransactions({ filter }: { filter: string }) {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center">
        <Receipt size={36} className="text-gray-600" />
      </div>
      <h3 className="text-xl font-bold mb-2">
        {filter ? `No ${filter} Transactions` : 'No Transactions Yet'}
      </h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        {filter
          ? `You haven't made any ${filter} trades yet.`
          : 'Start trading to see your transaction history here.'
        }
      </p>
    </motion.div>
  )
}

// ── Transaction Row ─────────────────────────────────────────────────────────
function TransactionRow({ tx, index }: { tx: Transaction; index: number }) {
  const isBuy = tx.type === 'buy'
  const hasPnL = tx.profit_loss !== undefined && tx.profit_loss !== null

  return (
    <motion.tr
      className="group hover:bg-white/[0.02] transition"
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      {/* Date */}
      <td className="py-3.5 px-4 text-sm text-gray-400 font-mono">
        {new Date(tx.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        })}
      </td>

      {/* Type Badge */}
      <td className="py-3.5 px-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
          isBuy
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {isBuy ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isBuy ? 'BUY' : 'SELL'}
        </span>
      </td>

      {/* Stock */}
      <td className="py-3.5 px-4">
        <p className="font-display font-bold text-sm">{tx.symbol}</p>
        <p className="text-xs text-gray-500 truncate max-w-[120px]">{tx.name}</p>
      </td>

      {/* Quantity */}
      <td className="py-3.5 px-4 font-mono text-sm text-right">{tx.quantity}</td>

      {/* Price */}
      <td className="py-3.5 px-4 font-mono text-sm text-right">{formatCurrency(tx.price)}</td>

      {/* Total */}
      <td className="py-3.5 px-4 font-mono text-sm font-bold text-right">{formatCurrency(tx.total)}</td>

      {/* P&L */}
      <td className="py-3.5 px-4 text-right">
        {hasPnL ? (
          <span className={cnColor(tx.profit_loss!) + ' font-mono text-sm font-bold'}>
            {formatCurrency(tx.profit_loss!)}
          </span>
        ) : (
          <span className="text-gray-600 font-mono text-xs">—</span>
        )}
      </td>
    </motion.tr>
  )
}

// ── TransactionsPage ────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [activeType, setActiveType] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [page, setPage] = useState(1)

  const {
    data: txData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transactions', { type: activeType || undefined, stock_id: stockFilter || undefined, page }],
    queryFn: () => transactions.list({
      type: activeType || undefined,
      page,
    }),
    refetchOnMount: true,
  })

  // The API might return array directly or wrapped
  const txList: Transaction[] = Array.isArray(txData) ? txData : (txData as any)?.transactions || []
  const totalPages = (txData as any)?.pages || 1

  const filteredTxs = stockFilter
    ? txList.filter(tx => tx.symbol.toLowerCase().includes(stockFilter.toLowerCase()))
    : txList

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display font-bold text-2xl mb-2">
          <span className="gradient-text-cyan">Transactions</span>
        </h1>
        <p className="text-gray-500 text-sm">Track every trade you make</p>
      </motion.div>

      {/* ── Filters Bar ────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Type Tabs */}
        <div className="flex rounded-xl bg-white/5 p-1 gap-0.5">
          {typeFilters.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setActiveType(value); setPage(1) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                activeType === value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Stock Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            placeholder="Filter by symbol..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition"
          />
        </div>
      </motion.div>

      {/* ── Error State ────────────────────────────────────────────────── */}
      {error && (
        <motion.div
          className="glass rounded-2xl p-8 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Failed to load transactions</h3>
          <p className="text-gray-500 text-sm">{(error as Error)?.message || 'Something went wrong'}</p>
        </motion.div>
      )}

      {/* ── Loading State ──────────────────────────────────────────────── */}
      {isLoading && <TableSkeleton />}

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {!isLoading && !error && filteredTxs.length === 0 && (
        <EmptyTransactions filter={activeType} />
      )}

      {/* ── Transactions Table ─────────────────────────────────────────── */}
      {!isLoading && !error && filteredTxs.length > 0 && (
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-3 px-4 text-left text-xs text-gray-500 uppercase tracking-wider font-mono">Date</th>
                  <th className="py-3 px-4 text-left text-xs text-gray-500 uppercase tracking-wider font-mono">Type</th>
                  <th className="py-3 px-4 text-left text-xs text-gray-500 uppercase tracking-wider font-mono">Stock</th>
                  <th className="py-3 px-4 text-right text-xs text-gray-500 uppercase tracking-wider font-mono">Qty</th>
                  <th className="py-3 px-4 text-right text-xs text-gray-500 uppercase tracking-wider font-mono">Price</th>
                  <th className="py-3 px-4 text-right text-xs text-gray-500 uppercase tracking-wider font-mono">Total</th>
                  <th className="py-3 px-4 text-right text-xs text-gray-500 uppercase tracking-wider font-mono">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTxs.map((tx, i) => (
                  <TransactionRow key={tx.id} tx={tx} index={i} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
              <span className="text-xs text-gray-500 font-mono">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
