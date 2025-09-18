'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { useAccount } from 'wagmi'

// ----------------------
// RPC ها
// ----------------------
const RPC_URLS = [
  'https://data-seed-prebsc-1-s1.binance.org:8545/',
  'https://bsc-testnet.nodereal.io/v1/9c812bc3d9c440d6b95a80cfe42000d2',
  'https://convincing-alpha-mansion.bsc-testnet.quiknode.pro/6bb032c7354d8511a736b012febb01f7068d0008/'
]

// ✅ آدرس Router واقعی Pancake/DEX روی BSC تست‌نت را وارد کن
const contractAddress = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1' 

// ✅ توکن‌های ورودی و خروجی
const tokenIn  = '0x4c7e9787509174ef0976d603c54a9a0d41583830'
const tokenOut = '0x8a9b145542f6ff710ff30400a721e680d86d4690'

// ✅ ABI
const abi = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' }
    ],
    name: 'getAmountsOut',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
]

// Provider با fallback
async function getProviderWithFallback() {
  for (const url of RPC_URLS) {
    try {
      console.log(`⏳ Trying RPC: ${url}`)
      const provider = new ethers.JsonRpcProvider(url)
      await provider.getBlockNumber()
      console.log(`✅ Connected to RPC: ${url}`)
      return provider
    } catch (err: any) {
      console.warn(`❌ RPC failed: ${url}`, err.message)
    }
  }
  throw new Error('All RPC endpoints failed!')
}

export default function ContractButton() {
  const { isConnected } = useAccount()
  const [amountIn, setAmountIn] = useState('')
  const [result, setResult] = useState<string>('')

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // ----------------------
  // خواندن مقدار خروجی
  // ----------------------
  const fetchAmount = async (amt: string) => {
    if (!amt || isNaN(Number(amt))) {
      setResult('')
      return
    }
    try {
      const provider = await getProviderWithFallback()
      const contract = new ethers.Contract(contractAddress, abi, provider)
      const parsedAmount = ethers.parseUnits(amt, 18)
      const amounts = await contract.getAmountsOut(parsedAmount, [tokenIn, tokenOut])
      const out = ethers.formatUnits(amounts[amounts.length - 1], 18)
      console.log('🔁 Updated output:', out)
      setResult(out)
    } catch (err) {
      console.error('❌ fetchAmount error:', err)
      setResult('')
    }
  }

  // هر بار که amountIn تغییر کند: فوراً درخواست و استارت interval
  useEffect(() => {
    if (!isConnected) return
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (amountIn) {
      // درخواست اولیه
      fetchAmount(amountIn)

      // هر ۵ ثانیه یک بار
      intervalRef.current = setInterval(() => {
        fetchAmount(amountIn)
      }, 5000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [amountIn, isConnected])

  if (!isConnected) {
    return <p className="text-white text-center mt-4">لطفاً ابتدا کیف‌پول خود را وصل کنید.</p>
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 space-y-6">
      <h1 className="text-2xl text-white mb-4">💱 Get Amount Out</h1>

      <input
        type="text"
        placeholder="Amount In (e.g. 1.0)"
        value={amountIn}
        onChange={(e) => setAmountIn(e.target.value)}
        className="w-64 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <input
        type="text"
        readOnly
        placeholder="Output will appear here"
        value={result}
        className="w-64 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none"
      />

      <p className="text-gray-400 text-sm">
        مقدار هر ۵ ثانیه یک‌بار به‌روز می‌شود.
      </p>
    </div>
  )
}
