"use client";

import { useEffect, useRef, useState } from "react";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { ChevronDown, Wallet } from "lucide-react";

import type { AppSolanaClient } from "@/app/providers";
import { RdoDevnetMint } from "@/components/rdo-devnet-mint";

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const client = useClient<AppSolanaClient>();
  const status = useWalletStatus(client);
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const address =
    mounted && connected
      ? String(connected.account.address)
      : null;

  const error = connect.error ?? disconnect.error;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  async function handleDisconnect() {
    await disconnect.dispatch();
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="radas-wallet-root">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          "radas-wallet-trigger",
          address ? "is-connected" : "",
        ].join(" ")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="radas-wallet-icon">
          <Wallet className="h-4 w-4" />
        </span>

        <span className="radas-wallet-copy">
          <span className="radas-wallet-label">
            {address ? "WALLET CONNECTED" : "SOLANA WALLET"}
          </span>

          <strong>
            {address
              ? truncateAddress(address)
              : mounted &&
                  (status === "connecting" ||
                    status === "reconnecting")
                ? "CONNECTING..."
                : "CONNECT"}
          </strong>
        </span>

        <span
          className={[
            "radas-wallet-status",
            address ? "is-online" : "",
          ].join(" ")}
        />

        <ChevronDown
          className={[
            "h-3.5 w-3.5 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <div className="radas-wallet-menu" role="menu">
          {mounted && connected && address ? (
            <div className="space-y-3">
              <div className="radas-wallet-connected-card">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">
                    Connected
                  </p>
                  <span className="radas-wallet-network">
                    DEVNET
                  </span>
                </div>

                <p
                  className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-200"
                  title={address}
                >
                  {address}
                </p>
              </div>

              <RdoDevnetMint />

              <button
                type="button"
                disabled={disconnect.isRunning}
                onClick={() => {
                  void handleDisconnect();
                }}
                className="radas-wallet-disconnect"
              >
                {disconnect.isRunning
                  ? "DISCONNECTING..."
                  : "DISCONNECT WALLET"}
              </button>
            </div>
          ) : (
            <div>
              <div className="radas-wallet-menu-head">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-white">
                    Connect Wallet
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Solana Devnet
                  </p>
                </div>

                <Wallet className="h-5 w-5 text-sky-400" />
              </div>

              <div className="mt-2 space-y-2">
                {!mounted || status === "pending" ? (
                  <p className="radas-wallet-message">
                    Detecting installed wallets...
                  </p>
                ) : wallets.length === 0 ? (
                  <div className="radas-wallet-message">
                    <p className="font-bold text-slate-200">
                      No compatible wallet detected.
                    </p>
                    <p className="mt-1 leading-5 text-slate-500">
                      Install or unlock Phantom, Solflare, Backpack,
                      or another Wallet Standard compatible wallet,
                      then refresh the page.
                    </p>
                  </div>
                ) : (
                  wallets.map((wallet) => (
                    <button
                      key={wallet.name}
                      type="button"
                      disabled={connect.isRunning}
                      onClick={() => {
                        connect.dispatch(wallet);
                      }}
                      className="radas-wallet-option"
                      role="menuitem"
                    >
                      <span className="radas-wallet-option-icon">
                        <Wallet className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1 truncate">
                        {wallet.name}
                      </span>

                      <span className="text-[9px] font-black uppercase tracking-[0.12em] text-sky-400">
                        CONNECT
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {error ? (
            <p className="radas-wallet-error">
              {error instanceof Error
                ? error.message
                : String(error)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}