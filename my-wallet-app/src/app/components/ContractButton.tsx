'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ethers } from 'ethers'
import { useAccount, useContractWrite , useWalletClient} from 'wagmi'

// ----------------------
// تنظیمات و آدرس‌ها
// ----------------------
const RPC_URLS = [
  'https://data-seed-prebsc-1-s1.binance.org:8545/',
  'https://bsc-testnet.nodereal.io/v1/9c812bc3d9c440d6b95a80cfe42000d2',
  'https://convincing-alpha-mansion.bsc-testnet.quiknode.pro/6bb032c7354d8511a736b012febb01f7068d0008/'
]

// آدرس Router (پنج‌کِیک یا DEX روی BSC testnet) — این را با آدرس واقعی جایگزین کن
const routerAddress = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1' // <<< حتما این را با آدرس واقعی جایگزین کن

// توکن‌های ثابت که گفتی
const tokenIn = '0x4c7e9787509174ef0976d603c54a9a0d41583830'
const tokenOut = '0x8a9b145542f6ff710ff30400a721e680d86d4690'

// ABI: getAmountsOut + swapExactTokensForTokens + ERC20 approve
const routerAbi = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' }
    ],
    name: 'getAmountsOut',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

const erc20Abi = [
  // approve
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // allowance (اختیاری برای چک کردن)
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // decimals (اختیاری)
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
]

// ----------------------
// fallback provider
// ----------------------
async function getProviderWithFallback() {
  for (const url of RPC_URLS) {
    try {
      console.log(`⏳ Trying RPC: ${url}`)
      const provider = new ethers.JsonRpcProvider(url)
      await provider.getBlockNumber()
      console.log(`✅ Connected to RPC: ${url}`)
      return provider
    } catch (err: any) {
      console.warn(`❌ RPC failed: ${url}`, err?.message ?? err)
    }
  }
  throw new Error('All RPC endpoints failed!')
}

// ----------------------
// کامپوننت
// ----------------------
export default function ContractButton() {
  const { address: walletAddress, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  // ورودی ها
  const [amountIn, setAmountIn] = useState('') // string like "1.0"
  const [amountOutMin, setAmountOutMin] = useState('') // user-editable, default will be amountsOut
  const [expectedOut, setExpectedOut] = useState('') // value from getAmountsOut
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // --------- خواندن expected output (getAmountsOut) -----------
  const fetchAmountsOut = async (amt: string) => {
    if (!amt || isNaN(Number(amt))) {
      console.log('⚠️ fetchAmountsOut: invalid amountIn')
      setExpectedOut('')
      return
    }
    try {
      console.log('🔵 fetchAmountsOut: start', { amountIn: amt })
      const provider = await getProviderWithFallback()
      const router = new ethers.Contract(routerAddress, routerAbi, provider)
      const parsed = ethers.parseUnits(amt, 18) // فرض 18 دسی‌مال؛ در صورت نیاز تغییر بده
      console.log('🔵 fetchAmountsOut: parsed amount (wei):', parsed.toString())

      const amounts: ethers.BigNumber[] = await router.getAmountsOut(parsed, [tokenIn, tokenOut])
      console.log('🔵 fetchAmountsOut: raw amounts:', amounts)

      const out = ethers.formatUnits(amounts[amounts.length - 1], 18)
      console.log('✅ fetchAmountsOut: formatted out:', out)
      setExpectedOut(out)

      // اگر کاربر هنوز amountOutMin را تغییر نداده، مقدار پیش‌فرض را ست کن
      if (!amountOutMin) {
        setAmountOutMin(out)
      }
    } catch (err: any) {
      console.error('❌ fetchAmountsOut error:', err)
      setExpectedOut('')
    }
  }

  // هر بار amountIn تغییر کند: فوری fetch و سپس هر 5 ثانیه اتوماتیک
  useEffect(() => {
    if (!isConnected) return

    // پاکسازی interval قبلی
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (amountIn && !isNaN(Number(amountIn))) {
      fetchAmountsOut(amountIn) // اولین درخواست بلافاصله

      intervalRef.current = setInterval(() => {
        console.log('🔁 interval fetchAmountsOut running for amountIn:', amountIn)
        fetchAmountsOut(amountIn)
      }, 5000)
    } else {
      setExpectedOut('')
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountIn, isConnected])

  // ------------------ APPROVE (ERC20) ------------------
  // approve using useContractWrite; mode recklesslyUnprepared to allow direct args
  const { write: approveWrite, isLoading: approveLoading, isError: approveError, error: approveErrorObj } =
    useContractWrite({
      address: tokenIn,
      abi: erc20Abi,
      functionName: 'approve',
      mode: 'recklesslyUnprepared'
      // args will be provided at click time via write?.({ args: [...] }) in wagmi v2 pattern
    } as any) // cast any to avoid TS mismatch for dynamic args

  // ------------------ SWAP ------------------
  const { write: swapWrite, isLoading: swapLoading, isError: swapError, error: swapErrorObj } =
    useContractWrite({
      address: routerAddress,
      abi: routerAbi,
      functionName: 'swapExactTokensForTokens',
      mode: 'recklesslyUnprepared'
      // args will be passed at click time
    } as any)

  // Helper: approve handler

  const handleApprove = async () => {
    try {
      if (!isConnected) throw new Error('👛 کیف‌پول وصل نیست')
      if (!walletClient) throw new Error('⚠️ walletClient هنوز آماده نیست')

      console.log('🚀 Approve clicked')
      console.log('✅ Wallet client:', walletClient)

      // wagmi walletClient را به یک Signer اتریوم (ethers v6) تبدیل می‌کنیم
      const provider = new ethers.BrowserProvider(walletClient)
      const signer   = await provider.getSigner()
      console.log('✅ Signer address:', await signer.getAddress())

      const token = new ethers.Contract(tokenIn, erc20Abi, signer)
      const tx = await token.approve(routerAddress, ethers.MaxUint256)

      console.log('handleApprove: tx (approve) submitted:', tx.hash)

      const receipt = await tx.wait()
      console.log('✅ Approve confirmed in block:', receipt.blockNumber)
    } catch (err: any) {
      console.error('❌ Approve error:', err.message || err)
    }
  }

  // Helper: swap handler
 
const handleSwap = async () => {
  try {
    if (!isConnected || !walletClient || !walletAddress) {
      console.error('❌ کیف‌پول وصل نیست یا walletClient آماده نیست')
      return
    }

    if (!amountIn || isNaN(Number(amountIn))) {
      console.error('❌ مقدار amountIn معتبر نیست')
      return
    }

    if (!amountOutMin || isNaN(Number(amountOutMin))) {
      console.error('❌ مقدار amountOutMin معتبر نیست')
      return
    }

    console.log('🔵 handleSwap: شروع فرآیند swap')

    const provider = new ethers.BrowserProvider(walletClient)
    const signer   = await provider.getSigner()
    const signerAddr = await signer.getAddress()
    console.log('✅ Signer آماده است:', signerAddr)

    const router = new ethers.Contract(routerAddress, routerAbi, signer)

    const amountInWei    = ethers.parseUnits(amountIn, 18)
    const amountOutMinWei = ethers.parseUnits(amountOutMin, 18)
    const path           = [tokenIn, tokenOut]
    const to             = signerAddr
    const deadline       = BigInt(Math.floor(Date.now() / 1000) + 60 * 10) // 10 دقیقه بعد

    console.log('🔵 handleSwap: args آماده شدند', {
      amountInWei: amountInWei.toString(),
      amountOutMinWei: amountOutMinWei.toString(),
      path,
      to,
      deadline: deadline.toString()
    })

    // ارسال تراکنش
    const tx = await router.swapExactTokensForTokens(
      amountInWei,
      amountOutMinWei,
      path,
      to,
      deadline
    )
    console.log('🔵 handleSwap: تراکنش ارسال شد', tx.hash)

    const receipt = await tx.wait()
    console.log('✅ handleSwap: تراکنش تایید شد در بلاک', receipt.blockNumber)

  } catch (err: any) {
    console.error('❌ handleSwap error:', err.message || err)
  }
}

  return (
    <div className="min-h-screen bg-gray-600 flex flex-col items-center justify-center p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Swap UI (BSC Testnet)</h2>

      <div className="w-full max-w-md space-y-3">
        <input
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
          placeholder="Amount In (e.g. 1.0)"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
        />

        <input
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
          placeholder="Amount Out Min (editable)"
          value={amountOutMin}
          onChange={(e) => setAmountOutMin(e.target.value)}
        />

        <input
          readOnly
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-gray-300"
          placeholder="Expected Out (auto)"
          value={expectedOut}
        />

        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={approveLoading}
            className="flex-1 px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
          >
            {approveLoading ? 'Approving...' : 'Approve tokenIn'}
          </button>

          <button
            onClick={handleSwap}
            disabled={swapLoading}
            className="flex-1 px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {swapLoading ? 'Swapping...' : 'Swap'}
          </button>
        </div>

        {errorMsg && <p className="text-red-400 mt-2">{errorMsg}</p>}

        <div className="text-xs text-gray-400 mt-3">
          <p>tokenIn: <code className="text-sm">{tokenIn}</code></p>
          <p>tokenOut: <code className="text-sm">{tokenOut}</code></p>
          <p>router: <code className="text-sm">{routerAddress}</code></p>
          <p className="mt-2">Console logs show step-by-step progress.</p>
        </div>
      </div>
    </div>
  )
}