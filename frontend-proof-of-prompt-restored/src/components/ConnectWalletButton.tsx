'use client'

import { useConnect } from 'wagmi'
import { metaMask } from 'wagmi/connectors'

export function ConnectWalletButton() {
  const { connect } = useConnect()

  return (
    <button
      onClick={() => connect({ connector: metaMask() })}
      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
    >
      Connect MetaMask
    </button>
  )
}
