'use client'

import { useAccount } from 'wagmi'

export default function WalletStatus() {
  const { isConnected, address } = useAccount()
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-green-500"></div>
      <span className="text-green-500">
        Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
    </div>
  )
}