'use client'

// const projectId = 'ae2ba068cc4af264e3b0ec09e2bd054f'

import React, { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bscTestnet , bsc } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { createWeb3Modal } from '@web3modal/wagmi/react'

const projectId = 'ae2ba068cc4af264e3b0ec09e2bd054f'

// ✅ تعریف کانفیگ wagmi (نسخه 2)
const config = createConfig({
    autoConnect: true,
    chains: [bscTestnet],
    // chains: [bsc],
    transports: {
      [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545/'),
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
        // chains: [bsc],  
        themeMode: 'light',
        enableOnramp: false,  // مخفی کردن "Buy Crypto"
        enableSwap: false,   // مخفی کردن "Swap"
        enableAnalytics: false, // مخفی کردن "Activity"
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
