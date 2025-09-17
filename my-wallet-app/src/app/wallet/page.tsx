'use client'

import React from 'react'
import Web3Providers from '../components/Web3Providers'
import { useAccount, useDisconnect } from 'wagmi'

export default function WalletPage() {
  return (
    <Web3Providers>
      <Main />
    </Web3Providers>
  )
}

function shorten(addr?: string) {
  return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : ''
}

function Main() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 rounded-2xl shadow-2xl bg-white text-center">
        {!isConnected ? (
          <>
            <h1 className="text-2xl font-semibold mb-4">اتصال کیف‌پول</h1>
            <w3m-button />
            <p className="mt-3 text-sm text-gray-500">کیف‌پول خود را با WalletConnect وصل کنید.</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-medium mb-2">متصل شد</h2>
            <p className="mb-4">آدرس: {shorten(address)}</p>
            <button
              className="px-4 py-2 rounded-lg border hover:bg-gray-100"
              onClick={() => disconnect()}
            >
              قطع اتصال
            </button>
          </>
        )}
      </div>
    </div>
  )
}
