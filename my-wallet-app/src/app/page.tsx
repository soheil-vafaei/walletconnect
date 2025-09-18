'use client'

import React from 'react'
import Web3Providers from './components/Web3Providers'
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import ContractButton from './components/ContractButton'

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

  // ✅ گرفتن موجودی ETH
  const { data: balance, isLoading } = useBalance({
    address,      // آدرسی که از useAccount گرفتیم
    chainId: 97    // mainnet (در صورت نیاز می‌توانی تغییر دهی)
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 rounded-2xl shadow-2xl bg-white text-center">
        {!isConnected ? (
          <>
            <h1 className="text-2xl font-semibold mb-4">اتصال کیف‌پول</h1>
            <w3m-button />
            <p className="mt-3 text-sm text-gray-500">
              کیف‌پول خود را با WalletConnect یا MetaMask وصل کنید.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-medium mb-2">متصل شد</h2>
            <p className="mb-2">
              آدرس: <span className="font-mono">{shorten(address)}</span>
            </p>
            {/* ✅ نمایش موجودی */}
            <p className="mb-4">
              موجودی:{' '}
              {isLoading
                ? 'در حال دریافت...'
                : `${balance?.formatted} ${balance?.symbol}`}
            </p>
            <button
              className="px-4 py-2 rounded-lg border hover:bg-gray-100"
              onClick={() => disconnect()}
            >
              قطع اتصال
            </button>
            <ContractButton />
          </>
          
        )}
      </div>
    </div>
  )
}
