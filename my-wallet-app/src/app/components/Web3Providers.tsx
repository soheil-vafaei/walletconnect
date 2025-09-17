'use client'

// const projectId = 'ae2ba068cc4af264e3b0ec09e2bd054f'

import React, { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { createWeb3Modal } from '@web3modal/wagmi/react'

const projectId = 'ae2ba068cc4af264e3b0ec09e2bd054f'

// ✅ تعریف کانفیگ wagmi (نسخه 2)
const config = createConfig({
  chains: [bscTestnet],              // حتماً آرایه
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545/'), // یا RPC دلخواه
  },
  connectors: [
    injected({ name: 'MetaMask' }),
    walletConnect({ projectId, showQrModal: true }),
  ],
})

const queryClient = new QueryClient()

export default function Web3Providers({ children }: { children: React.ReactNode }) {
  const created = useRef(false)

  useEffect(() => {
    if (!created.current && projectId) {
      createWeb3Modal({
        wagmiConfig: config,
        projectId,
        chains: [bscTestnet],     // باید آرایه باشه
        themeMode: 'light',
      })
      created.current = true
    }
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
