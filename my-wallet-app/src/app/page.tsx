'use client'

import React from 'react'
import Web3Providers from './components/Web3Providers'
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import ContractButton from './components/ContractButton'
import "./globals.css";

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

      <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <w3m-button network="hide" />
    </div>

            <ContractButton />
      
      </div>
    </div>
  )
}