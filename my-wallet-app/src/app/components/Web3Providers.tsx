'use client'

import React, { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { mainnet } from 'wagmi/chains'

const projectId = 'ae2ba068cc4af264e3b0ec09e2bd054f'
const metadata = {
  name: 'Connect-only page',
  description: 'A tiny Next.js page with only a Connect Wallet button',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  icons: []
}

const chains = [mainnet] as const

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableInjected: false, // فقط WalletConnect
  enableCoinbase: false,
  enableEmail: false
})

const queryClient = new QueryClient()

export default function Web3Providers({ children }: { children: React.ReactNode }) {
  const created = useRef(false)
  useEffect(() => {
    if (!created.current && projectId) {
      createWeb3Modal({ wagmiConfig, projectId })
      created.current = true
    }
  }, [])
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiConfig>
  )
}
