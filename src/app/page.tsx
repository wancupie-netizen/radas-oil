"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  CircleDollarSign,
  Coins,
  Factory,
  Fuel,
  Gauge,
  Gem,
  Home as HomeIcon,
  Landmark,
  LockKeyhole,
  MessageSquare,
  Newspaper,
  PackageOpen,
  Settings,
  ShoppingCart,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { RdoRewardClaim } from "@/components/rdo-reward-claim";

const STORAGE_KEY = "radas-oil-game-state";
const SAVE_VERSION = 9;

const LOCAL_PLAYER_ID = "local-player-001";

const TOKEN_SYMBOL = "RDO";
const OIL_PRICE = 0.1;
const DURABILITY_LOSS_PER_COLLECTION = 5;
const REPAIR_COST_PER_POINT = 0.05;
const DEFAULT_MAX_DURABILITY = 100;

const STARTER_WELL_OUTPUT = 5;
const STARTER_WELL_CYCLE_SECONDS = 30;
const STANDARD_WELL_OUTPUT = 30;
const STANDARD_WELL_CYCLE_SECONDS = 20;
const STANDARD_WELL_MINT_COST = 100;
const STANDARD_WELL_USD_REFERENCE = 100;

type WellStatus = "Extracting" | "Ready" | "Locked" | "Damaged";
type AssetAcquisitionType =
  | "Genesis"
  | "Starter Claim"
  | "Mint"
  | "Purchase";

type WellTier =
  | "Starter"
  | "Standard"
  | "Industrial"
  | "Deep Sea"
  | "Ultra Deep";
type WellClass = "Starter" | "Common" | "Uncommon" | "Rare" | "Legendary";

const MAX_WELL_LEVEL = 5;

const WELL_CLASS_CONFIG: Record<
  WellTier,
  { className: WellClass; baseMintCost: number }
> = {
  Starter: { className: "Starter", baseMintCost: 0 },
  Standard: { className: "Common", baseMintCost: 100 },
  Industrial: { className: "Uncommon", baseMintCost: 450 },
  "Deep Sea": { className: "Rare", baseMintCost: 1500 },
  "Ultra Deep": { className: "Legendary", baseMintCost: 5000 },
};

const UPGRADE_COST_MULTIPLIERS = [0, 0.25, 0.5, 1, 2];
const UPGRADE_OUTPUT_MULTIPLIERS = [0, 0.15, 0.2, 0.25, 0.35];
const UPGRADE_CYCLE_MULTIPLIERS = [0, 0, 0.05, 0.05, 0.1];

const WELL_PROMOTION_CONFIG: Partial<
  Record<WellTier, {
    nextTier: WellTier;
    rdoCost: number;
    oilCost: number;
    output: number;
    cycleSeconds: number;
    maxDurability: number;
  }>
> = {
  Standard: {
    nextTier: "Industrial",
    rdoCost: 450,
    oilCost: 5000,
    output: 75,
    cycleSeconds: 18,
    maxDurability: 120,
  },
  Industrial: {
    nextTier: "Deep Sea",
    rdoCost: 1500,
    oilCost: 15000,
    output: 180,
    cycleSeconds: 16,
    maxDurability: 150,
  },
  "Deep Sea": {
    nextTier: "Ultra Deep",
    rdoCost: 5000,
    oilCost: 50000,
    output: 450,
    cycleSeconds: 14,
    maxDurability: 200,
  },
};

function getWellPromotion(well: Well) {
  if (well.level < MAX_WELL_LEVEL) return null;
  return WELL_PROMOTION_CONFIG[well.tier] ?? null;
}

function getWellClass(tier: WellTier): WellClass {
  return WELL_CLASS_CONFIG[tier].className;
}

function getWellUpgradeCost(well: Well) {
  if (well.level >= MAX_WELL_LEVEL) return 0;
  const base = WELL_CLASS_CONFIG[well.tier].baseMintCost;
  if (base <= 0) return 0;
  return Math.ceil(base * UPGRADE_COST_MULTIPLIERS[well.level]);
}

type GameSaveData = {
  wells: Well[];
  storage: number;
  tokenBalance: number;
  claimableRdo: number;
  claimedRdo: number;
  claimHistory: RewardClaim[];
  storageLevel: number;
  storageCapacity: number;
  transactions: Transaction[];
  stats: PlayerStats;
  hasClaimedStarterWell: boolean;
};

type GameSave = {
  version: number;
  savedAt: number;
  data: GameSaveData;
};

type RewardClaim = {
  id: string;
  amount: number;
  createdAt: number;
  status: "pending" | "completed" | "failed";
  signature: string | null;
  walletAddress: string | null;
};

type Transaction = {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  createdAt: number;
};

type PlayerStats = {
  totalOilProduced: number;
  totalOilSold: number;
  totalTokenEarned: number;
  totalTokenSpent: number;
};

type Well = {
  id: number;
  name: string;
  status: WellStatus;
  secondsLeft: number;
  readyAt: number | null;
  output: number;
  level: number;
  cycleSeconds: number;
  durability: number;
  maxDurability: number;
  tier: WellTier;
  assetId: string;
  ownerId: string;
  acquiredAt: number;
  acquisitionType: AssetAcquisitionType;
};

const INITIAL_WELLS: Well[] = [
  {
    id: 1,
    name: "Well A-01",
    status: "Extracting",
    secondsLeft: 20,
    readyAt: Date.now() + 20_000,
    output: 10,
    level: 1,
    cycleSeconds: 20,
    durability: DEFAULT_MAX_DURABILITY,
    maxDurability: DEFAULT_MAX_DURABILITY,
    tier: "Standard",
    assetId: "RADAS-WELL-000001",
    ownerId: LOCAL_PLAYER_ID,
    acquiredAt: Date.now(),
    acquisitionType: "Genesis",
  },
  {
    id: 2,
    name: "Well A-02",
    status: "Ready",
    secondsLeft: 0,
    readyAt: null,
    output: 10,
    level: 1,
    cycleSeconds: 20,
    durability: DEFAULT_MAX_DURABILITY,
    maxDurability: DEFAULT_MAX_DURABILITY,
    tier: "Standard",
    assetId: "RADAS-WELL-000002",
    ownerId: LOCAL_PLAYER_ID,
    acquiredAt: Date.now(),
    acquisitionType: "Genesis",
  },
  {
    id: 3,
    name: "Well A-03",
    status: "Locked",
    secondsLeft: 0,
    readyAt: null,
    output: 10,
    level: 1,
    cycleSeconds: 20,
    durability: DEFAULT_MAX_DURABILITY,
    maxDurability: DEFAULT_MAX_DURABILITY,
    tier: "Standard",
    assetId: "RADAS-WELL-000003",
    ownerId: LOCAL_PLAYER_ID,
    acquiredAt: Date.now(),
    acquisitionType: "Genesis",
  },
];

function normalizeGameSave(raw: unknown): GameSaveData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const rawRecord = raw as Record<string, unknown>;

  // Versioned save format
  const source =
    typeof rawRecord.version === "number" &&
    rawRecord.data &&
    typeof rawRecord.data === "object"
      ? (rawRecord.data as Record<string, unknown>)
      : rawRecord;

  // Legacy saves before Patch 014 have no version/data wrapper.
  // They are treated as Version 0 and migrated here automatically.

  const rawWells = Array.isArray(source.wells)
    ? source.wells
    : INITIAL_WELLS;

  const restoredWells: Well[] = rawWells.map((rawWell, index) => {
    const well =
      rawWell && typeof rawWell === "object"
        ? (rawWell as Partial<Well>)
        : {};

    const status: WellStatus =
      well.status === "Ready" ||
      well.status === "Locked" ||
      well.status === "Damaged" ||
      well.status === "Extracting"
        ? well.status
        : "Ready";

    const level =
      typeof well.level === "number" && well.level > 0
        ? Math.min(MAX_WELL_LEVEL, Math.floor(well.level))
        : 1;

    const cycleSeconds =
      typeof well.cycleSeconds === "number" &&
      well.cycleSeconds > 0
        ? well.cycleSeconds
        : 20;

    const output =
      typeof well.output === "number" && well.output > 0
        ? well.output
        : 10;

    const baseWell: Well = {
      id:
        typeof well.id === "number"
          ? well.id
          : index + 1,
      name:
        typeof well.name === "string"
          ? well.name
          : `Well ${index + 1}`,
      status,
      secondsLeft:
        typeof well.secondsLeft === "number"
          ? Math.max(0, well.secondsLeft)
          : 0,
      readyAt:
        typeof well.readyAt === "number"
          ? well.readyAt
          : null,
      output,
      level,
      cycleSeconds,
      durability:
        typeof well.durability === "number"
          ? Math.min(
              DEFAULT_MAX_DURABILITY,
              Math.max(0, well.durability),
            )
          : DEFAULT_MAX_DURABILITY,
      maxDurability:
        typeof well.maxDurability === "number" &&
        well.maxDurability > 0
          ? well.maxDurability
          : DEFAULT_MAX_DURABILITY,
      tier:
        well.tier === "Starter" ||
        well.tier === "Standard" ||
        well.tier === "Industrial" ||
        well.tier === "Deep Sea" ||
        well.tier === "Ultra Deep"
          ? well.tier
          : "Standard",
      assetId:
        typeof well.assetId === "string" && well.assetId.length > 0
          ? well.assetId
          : `RADAS-WELL-${String(
              typeof well.id === "number" ? well.id : index + 1,
            ).padStart(6, "0")}`,
      ownerId:
        typeof well.ownerId === "string" && well.ownerId.length > 0
          ? well.ownerId
          : LOCAL_PLAYER_ID,
      acquiredAt:
        typeof well.acquiredAt === "number" && well.acquiredAt > 0
          ? well.acquiredAt
          : Date.now(),
      acquisitionType:
        well.acquisitionType === "Starter Claim" ||
        well.acquisitionType === "Mint" ||
        well.acquisitionType === "Purchase" ||
        well.acquisitionType === "Genesis"
          ? well.acquisitionType
          : "Genesis",
    };

    if (baseWell.status !== "Extracting") {
      return {
        ...baseWell,
        readyAt: null,
        secondsLeft: 0,
      };
    }

    const readyAt =
      typeof baseWell.readyAt === "number"
        ? baseWell.readyAt
        : Date.now() + baseWell.secondsLeft * 1000;

    const remainingSeconds = Math.max(
      0,
      Math.ceil((readyAt - Date.now()) / 1000),
    );

    if (remainingSeconds === 0) {
      return {
        ...baseWell,
        status: "Ready",
        secondsLeft: 0,
        readyAt: null,
      };
    }

    return {
      ...baseWell,
      status: "Extracting",
      secondsLeft: remainingSeconds,
      readyAt,
    };
  });

  const rawStats =
    source.stats && typeof source.stats === "object"
      ? (source.stats as Partial<PlayerStats>)
      : {};

  return {
    wells: restoredWells,

    storage:
      typeof source.storage === "number"
        ? Math.max(0, source.storage)
        : 25,

    tokenBalance:
      typeof source.tokenBalance === "number"
        ? Math.max(0, source.tokenBalance)
        : 100,

    // Patch 026A: only RDO earned from oil sales after this migration
    // becomes claimable. Legacy/default balances remain internal-only.
    claimableRdo:
      typeof source.claimableRdo === "number"
        ? Math.max(0, source.claimableRdo)
        : 0,

    claimedRdo:
      typeof source.claimedRdo === "number"
        ? Math.max(0, source.claimedRdo)
        : 0,

    claimHistory: Array.isArray(source.claimHistory)
      ? (source.claimHistory as RewardClaim[]).slice(0, 20)
      : [],

    storageLevel:
      typeof source.storageLevel === "number"
        ? Math.max(1, source.storageLevel)
        : 1,

    storageCapacity:
      typeof source.storageCapacity === "number"
        ? Math.max(100, source.storageCapacity)
        : 100,

    transactions: Array.isArray(source.transactions)
      ? (source.transactions as Transaction[]).slice(0, 20)
      : [],

    hasClaimedStarterWell:
      typeof source.hasClaimedStarterWell === "boolean"
        ? source.hasClaimedStarterWell
        : false,

    stats: {
      totalOilProduced:
        typeof rawStats.totalOilProduced === "number"
          ? Math.max(0, rawStats.totalOilProduced)
          : 0,

      totalOilSold:
        typeof rawStats.totalOilSold === "number"
          ? Math.max(0, rawStats.totalOilSold)
          : 0,

      totalTokenEarned:
        typeof rawStats.totalTokenEarned === "number"
          ? Math.max(0, rawStats.totalTokenEarned)
          : 0,

      totalTokenSpent:
        typeof rawStats.totalTokenSpent === "number"
          ? Math.max(0, rawStats.totalTokenSpent)
          : 0,
    },
  };
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function Home() {
  const [wells, setWells] = useState<Well[]>(INITIAL_WELLS);
  const [storage, setStorage] = useState(25);
  const [tokenBalance, setTokenBalance] = useState(100);
  const [claimableRdo, setClaimableRdo] = useState(0);
  const [claimedRdo, setClaimedRdo] = useState(0);
  const [claimHistory, setClaimHistory] = useState<RewardClaim[]>([]);
  const [storageLevel, setStorageLevel] = useState(1);
  const [storageCapacity, setStorageCapacity] = useState(100);
  const [sellAmount, setSellAmount] = useState("10");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PlayerStats>({
    totalOilProduced: 0,
    totalOilSold: 0,
    totalTokenEarned: 0,
    totalTokenSpent: 0,
  });
  const [gameLoaded, setGameLoaded] = useState(false);
  const [mintOpen, setMintOpen] = useState(false);
  const [progressWellId, setProgressWellId] = useState<number | null>(null);
  const [hasClaimedStarterWell, setHasClaimedStarterWell] = useState(false);
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const cloudSaveRef = useRef<GameSave | null>(null);
  const lastCloudSignatureRef = useRef("");
  const SELL_AMOUNT = 10;

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const restored = normalizeGameSave(parsed);

        if (restored) {
          setWells(restored.wells);
          setStorage(restored.storage);
          setTokenBalance(restored.tokenBalance);
          setClaimableRdo(restored.claimableRdo);
          setClaimedRdo(restored.claimedRdo);
          setClaimHistory(restored.claimHistory);
          setStorageLevel(restored.storageLevel);
          setStorageCapacity(restored.storageCapacity);
          setTransactions(restored.transactions);
          setStats(restored.stats);
          setHasClaimedStarterWell(restored.hasClaimedStarterWell);
        }
      } catch {
        console.warn("Unable to load saved RADAS OIL game state.");
      }
    }

    setGameLoaded(true);
  }, []);

  useEffect(() => {
    if (!gameLoaded || !supabase) {
      return;
    }

    const supabaseClient = supabase;
    let cancelled = false;

    async function loadCloudSave() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        let user = session?.user ?? null;

        if (!user) {
          const {
            data: anonymousData,
            error: anonymousError,
          } = await supabaseClient.auth.signInAnonymously();

          if (anonymousError) {
            throw anonymousError;
          }

          user = anonymousData.user;
        }

        if (!user || cancelled) {
          return;
        }

        const { data: row, error: loadError } = await supabaseClient
          .from("game_saves")
          .select("save_data")
          .eq("user_id", user.id)
          .maybeSingle();

        if (loadError) {
          throw loadError;
        }

        const localRaw = localStorage.getItem(STORAGE_KEY);
        let localSavedAt = 0;

        if (localRaw) {
          try {
            const parsedLocal = JSON.parse(localRaw) as {
              savedAt?: unknown;
            };

            if (typeof parsedLocal.savedAt === "number") {
              localSavedAt = parsedLocal.savedAt;
            }
          } catch {
            localSavedAt = 0;
          }
        }

        const remoteSave =
          row?.save_data && typeof row.save_data === "object"
            ? (row.save_data as GameSave)
            : null;

        const remoteSavedAt =
          remoteSave && typeof remoteSave.savedAt === "number"
            ? remoteSave.savedAt
            : 0;

        if (remoteSave && remoteSavedAt > localSavedAt) {
          const restored = normalizeGameSave(remoteSave);

          if (restored && !cancelled) {
            setWells(restored.wells);
            setStorage(restored.storage);
            setTokenBalance(restored.tokenBalance);
            setClaimableRdo(restored.claimableRdo);
            setClaimedRdo(restored.claimedRdo);
            setClaimHistory(restored.claimHistory);
            setStorageLevel(restored.storageLevel);
            setStorageCapacity(restored.storageCapacity);
            setTransactions(restored.transactions);
            setStats(restored.stats);
            setHasClaimedStarterWell(restored.hasClaimedStarterWell);
          }
        }

        if (!cancelled) {
          setCloudUserId(user.id);
          setCloudReady(true);
        }
      } catch (error) {
        console.warn(
          "Supabase cloud save unavailable. Continuing with localStorage.",
          error,
        );
      }
    }

    void loadCloudSave();

    return () => {
      cancelled = true;
    };
  }, [gameLoaded]);

  useEffect(() => {
    if (!gameLoaded) {
      return;
    }

    const saveData: GameSave = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      data: {
        wells,
        storage,
        tokenBalance,
        claimableRdo,
        claimedRdo,
        claimHistory,
        storageLevel,
        storageCapacity,
        transactions,
        stats,
        hasClaimedStarterWell,
      },
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(saveData),
    );

    cloudSaveRef.current = saveData;
  }, [
    wells,
    storage,
    tokenBalance,
    claimableRdo,
    claimedRdo,
    claimHistory,
    storageLevel,
    storageCapacity,
    transactions,
    stats,
    hasClaimedStarterWell,
    gameLoaded,
  ]);

  useEffect(() => {
    if (!gameLoaded || !cloudReady || !cloudUserId || !supabase) {
      return;
    }

    const supabaseClient = supabase;
    let syncing = false;

    async function syncCloudSave() {
      if (syncing) {
        return;
      }

      const saveData = cloudSaveRef.current;

      if (!saveData) {
        return;
      }

      const signature = JSON.stringify({
        wells: saveData.data.wells.map((well) => ({
          id: well.id,
          status: well.status,
          readyAt: well.readyAt,
          output: well.output,
          level: well.level,
          cycleSeconds: well.cycleSeconds,
          durability: well.durability,
          maxDurability: well.maxDurability,
          tier: well.tier,
          assetId: well.assetId,
          ownerId: well.ownerId,
          acquiredAt: well.acquiredAt,
          acquisitionType: well.acquisitionType,
        })),
        storage: saveData.data.storage,
        tokenBalance: saveData.data.tokenBalance,
        claimableRdo: saveData.data.claimableRdo,
        claimedRdo: saveData.data.claimedRdo,
        claimHistory: saveData.data.claimHistory,
        storageLevel: saveData.data.storageLevel,
        storageCapacity: saveData.data.storageCapacity,
        transactions: saveData.data.transactions,
        stats: saveData.data.stats,
        hasClaimedStarterWell:
          saveData.data.hasClaimedStarterWell,
      });

      if (signature === lastCloudSignatureRef.current) {
        return;
      }

      syncing = true;

      try {
        const { error } = await supabaseClient
          .from("game_saves")
          .upsert(
            {
              user_id: cloudUserId,
              save_data: saveData,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            },
          );

        if (error) {
          throw error;
        }

        lastCloudSignatureRef.current = signature;
      } catch (error) {
        console.warn(
          "Unable to sync RADAS OIL save to Supabase.",
          error,
        );
      } finally {
        syncing = false;
      }
    }

    void syncCloudSave();

    const interval = window.setInterval(() => {
      void syncCloudSave();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [cloudReady, cloudUserId, gameLoaded]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWells((currentWells) =>
        currentWells.map((well) => {
          if (well.status !== "Extracting" || !well.readyAt) {
            return well;
          }

          const remainingSeconds = Math.max(
            0,
            Math.ceil((well.readyAt - Date.now()) / 1000),
          );

          if (remainingSeconds === 0) {
            return {
              ...well,
              secondsLeft: 0,
              readyAt: null,
              status: "Ready",
            };
          }

          return {
            ...well,
            secondsLeft: remainingSeconds,
          };
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function addTransaction(
    type: Transaction["type"],
    description: string,
    amount: number,
  ) {
    const transaction: Transaction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      description,
      amount,
      createdAt: Date.now(),
    };

    setTransactions((current) =>
      [transaction, ...current].slice(0, 20),
    );

    setStats((current) => ({
      ...current,
      totalTokenEarned:
        type === "income"
          ? current.totalTokenEarned + amount
          : current.totalTokenEarned,
      totalTokenSpent:
        type === "expense"
          ? current.totalTokenSpent + amount
          : current.totalTokenSpent,
    }));
  }

  function buyNewWell() {
    const cost = (wells.length + 1) * 25;

    if (tokenBalance < cost) {
      return;
    }

    const nextId =
      wells.length > 0
        ? Math.max(...wells.map((well) => well.id)) + 1
        : 1;

    const nextLetter = String.fromCharCode(64 + nextId);

    const newWell: Well = {
      id: nextId,
      name: `Well ${nextLetter}-${String(nextId).padStart(2, "0")}`,
      status: "Extracting",
      secondsLeft: 20,
      readyAt: Date.now() + 20_000,
      output: 10,
      level: 1,
      cycleSeconds: 20,
      durability: DEFAULT_MAX_DURABILITY,
      maxDurability: DEFAULT_MAX_DURABILITY,
      tier: "Standard",
      assetId: `RADAS-WELL-${Date.now()}-${nextId}`,
      ownerId: LOCAL_PLAYER_ID,
      acquiredAt: Date.now(),
      acquisitionType: "Purchase",
    };

    setTokenBalance((current) => current - cost);
    setWells((current) => [...current, newWell]);

    addTransaction(
      "expense",
      `Purchased ${newWell.name}`,
      cost,
    );
  }

  function createMintedWell(tier: WellTier) {
    const nextId =
      wells.length > 0
        ? Math.max(...wells.map((well) => well.id)) + 1
        : 1;

    const nextLetter = String.fromCharCode(
      65 + ((nextId - 1) % 26),
    );

    const isStarter = tier === "Starter";
    const cycleSeconds = isStarter
      ? STARTER_WELL_CYCLE_SECONDS
      : STANDARD_WELL_CYCLE_SECONDS;

    const newWell: Well = {
      id: nextId,
      name: `Well ${nextLetter}-${String(nextId).padStart(2, "0")}`,
      status: "Extracting",
      secondsLeft: cycleSeconds,
      readyAt: Date.now() + cycleSeconds * 1000,
      output: isStarter
        ? STARTER_WELL_OUTPUT
        : STANDARD_WELL_OUTPUT,
      level: 1,
      cycleSeconds,
      durability: DEFAULT_MAX_DURABILITY,
      maxDurability: DEFAULT_MAX_DURABILITY,
      tier,
      assetId: `RADAS-WELL-${Date.now()}-${nextId}`,
      ownerId: LOCAL_PLAYER_ID,
      acquiredAt: Date.now(),
      acquisitionType: isStarter ? "Starter Claim" : "Mint",
    };

    setWells((current) => [...current, newWell]);

    return newWell;
  }

  function mintStarterWell() {
    if (hasClaimedStarterWell) {
      return;
    }

    createMintedWell("Starter");
    setHasClaimedStarterWell(true);
    setMintOpen(false);
  }

  function mintStandardWell() {
    if (tokenBalance < STANDARD_WELL_MINT_COST) {
      return;
    }

    const newWell = createMintedWell("Standard");

    setTokenBalance(
      (current) => current - STANDARD_WELL_MINT_COST,
    );

    addTransaction(
      "expense",
      `Minted ${newWell.name} Standard Well`,
      STANDARD_WELL_MINT_COST,
    );

    setMintOpen(false);
  }

  function upgradeStorage() {
    const upgradeCost = storageLevel * 40;

    if (tokenBalance < upgradeCost) {
      return;
    }

    setTokenBalance((current) => current - upgradeCost);
    setStorageLevel((current) => current + 1);
    setStorageCapacity((current) => current + 50);

    addTransaction(
      "expense",
      `Storage upgraded to Level ${storageLevel + 1}`,
      upgradeCost,
    );
  }

  function upgradeWell(wellId: number) {
    const well = wells.find((item) => item.id === wellId);

    if (
      !well ||
      well.status === "Locked" ||
      well.status === "Damaged" ||
      well.level >= MAX_WELL_LEVEL
    ) {
      return;
    }

    const upgradeCost = getWellUpgradeCost(well);

    if (upgradeCost <= 0 || tokenBalance < upgradeCost) {
      return;
    }

    const outputMultiplier = UPGRADE_OUTPUT_MULTIPLIERS[well.level];
    const cycleMultiplier = UPGRADE_CYCLE_MULTIPLIERS[well.level];
    const nextLevel = well.level + 1;
    const nextOutput = Math.max(
      well.output + 1,
      Math.ceil(well.output * (1 + outputMultiplier)),
    );
    const nextCycleSeconds = Math.max(
      8,
      Math.round(well.cycleSeconds * (1 - cycleMultiplier)),
    );

    setTokenBalance((current) => current - upgradeCost);

    setWells((currentWells) =>
      currentWells.map((item) => {
        if (item.id !== wellId) return item;

        const extracting = item.status === "Extracting";

        return {
          ...item,
          level: nextLevel,
          output: nextOutput,
          cycleSeconds: nextCycleSeconds,
          secondsLeft: extracting ? nextCycleSeconds : item.secondsLeft,
          readyAt: extracting
            ? Date.now() + nextCycleSeconds * 1000
            : item.readyAt,
        };
      }),
    );

    addTransaction(
      "expense",
      `${well.name} upgraded to Level ${nextLevel}`,
      upgradeCost,
    );
  }
  function promoteWell(wellId: number) {
    const well = wells.find((item) => item.id === wellId);
    if (
      !well ||
      well.status === "Locked" ||
      well.status === "Damaged" ||
      well.level < MAX_WELL_LEVEL
    ) return;

    const promotion = getWellPromotion(well);
    if (!promotion) return;
    if (tokenBalance < promotion.rdoCost || storage < promotion.oilCost) return;

    setTokenBalance((current) => current - promotion.rdoCost);
    setStorage((current) => current - promotion.oilCost);

    setWells((current) =>
      current.map((item) =>
        item.id !== wellId
          ? item
          : {
              ...item,
              tier: promotion.nextTier,
              level: 1,
              output: promotion.output,
              cycleSeconds: promotion.cycleSeconds,
              secondsLeft: promotion.cycleSeconds,
              readyAt: Date.now() + promotion.cycleSeconds * 1000,
              durability: promotion.maxDurability,
              maxDurability: promotion.maxDurability,
              status: "Extracting",
            },
      ),
    );

    addTransaction(
      "expense",
      `${well.name} promoted to ${promotion.nextTier}`,
      promotion.rdoCost,
    );
    setProgressWellId(null);
  }

  function unlockWell(wellId: number) {
    const unlockCost = 50;

    const well = wells.find(
      (item) => item.id === wellId,
    );

    if (
      !well ||
      well.status !== "Locked" ||
      tokenBalance < unlockCost
    ) {
      return;
    }

    setTokenBalance(
      (current) => current - unlockCost,
    );

    setWells((currentWells) =>
      currentWells.map((item) =>
        item.id === wellId
          ? {
              ...item,
              status: "Extracting",
              secondsLeft: item.cycleSeconds,
              readyAt:
                Date.now() +
                item.cycleSeconds * 1000,
            }
          : item,
      ),
    );

    addTransaction(
      "expense",
      `Unlocked ${well.name}`,
      unlockCost,
    );
  }

  function repairWell(wellId: number) {
    const well = wells.find((item) => item.id === wellId);

    if (!well || well.status !== "Damaged") {
      return;
    }

    const missingDurability = Math.max(
      0,
      well.maxDurability - well.durability,
    );

    const repairCost = Math.max(
      1,
      Math.ceil(missingDurability * REPAIR_COST_PER_POINT),
    );

    if (tokenBalance < repairCost) {
      return;
    }

    setTokenBalance((current) => current - repairCost);

    setWells((currentWells) =>
      currentWells.map((item) =>
        item.id === wellId
          ? {
              ...item,
              durability: item.maxDurability,
              status: "Extracting",
              secondsLeft: item.cycleSeconds,
              readyAt: Date.now() + item.cycleSeconds * 1000,
            }
          : item,
      ),
    );

    addTransaction(
      "expense",
      `Repaired ${well.name}`,
      repairCost,
    );
  }

  function executeSale(amount: number) {
    const barrels = Math.floor(amount);

    if (
      !Number.isFinite(barrels) ||
      barrels <= 0 ||
      barrels > storage
    ) {
      return;
    }

    const saleValue = barrels * OIL_PRICE;

    setStats((current) => ({
      ...current,
      totalOilSold:
        current.totalOilSold + barrels,
    }));

    setTokenBalance(
      (current) => current + saleValue,
    );

    // Patch 026A: new oil-sale earnings are eligible for future
    // on-chain RDO claims. Existing/default RDO is not migrated here.
    setClaimableRdo(
      (current) => current + saleValue,
    );

    setStorage(
      (current) => current - barrels,
    );

    addTransaction(
      "income",
      `Sold ${barrels} bbl crude oil`,
      saleValue,
    );
  }

  function completeStandaloneRdoClaim(
    amount: number,
    signature: string,
    walletAddress: string,
  ) {
    const safeAmount = Math.min(Math.max(0, amount), claimableRdo, tokenBalance);
    if (safeAmount <= 0) return;

    const now = Date.now();
    setClaimableRdo((current) => Math.max(0, current - safeAmount));
    setClaimedRdo((current) => current + safeAmount);
    setTokenBalance((current) => Math.max(0, current - safeAmount));

    const completedClaim: RewardClaim = {
      id: `claim-${now}-${Math.random().toString(36).slice(2, 8)}`,
      amount: safeAmount,
      createdAt: now,
      status: "completed",
      signature,
      walletAddress,
    };

    setClaimHistory((current) =>
      [completedClaim, ...current].slice(0, 20),
    );
  }

  function sellOil() {
    executeSale(SELL_AMOUNT);
  }

  function sellCustomOil() {
    executeSale(Number(sellAmount));
  }

  function sellAllOil() {
    executeSale(storage);
  }

  function collectOil(wellId: number) {
    const well = wells.find(
      (item) => item.id === wellId,
    );

    if (!well || well.status !== "Ready") {
      return;
    }

    if (
      storage + well.output >
      storageCapacity
    ) {
      return;
    }

    setStorage(
      (current) => current + well.output,
    );

    setStats((current) => ({
      ...current,
      totalOilProduced:
        current.totalOilProduced + well.output,
    }));

    const nextDurability = Math.max(
      0,
      well.durability - DURABILITY_LOSS_PER_COLLECTION,
    );

    setWells((currentWells) =>
      currentWells.map((item) =>
        item.id === wellId
          ? nextDurability === 0
            ? {
                ...item,
                durability: 0,
                status: "Damaged",
                secondsLeft: 0,
                readyAt: null,
              }
            : {
                ...item,
                durability: nextDurability,
                status: "Extracting",
                secondsLeft: item.cycleSeconds,
                readyAt:
                  Date.now() +
                  item.cycleSeconds * 1000,
              }
          : item,
      ),
    );
  }

  const progressWell =
    progressWellId === null
      ? null
      : wells.find((well) => well.id === progressWellId) ?? null;

  const progressUpgradeCost = progressWell
    ? getWellUpgradeCost(progressWell)
    : 0;

  const progressPromotion = progressWell
    ? getWellPromotion(progressWell)
    : null;

  const canAffordPromotion =
    progressPromotion !== null &&
    tokenBalance >= progressPromotion.rdoCost &&
    storage >= progressPromotion.oilCost;

  const newWellCost =
    (wells.length + 1) * 25;

  const canBuyWell =
    tokenBalance >= newWellCost;

  const activeWells = wells.filter(
    (well) =>
      well.status !== "Locked" &&
      well.status !== "Damaged",
  );

  const totalOutput = activeWells.reduce(
    (total, well) => total + well.output,
    0,
  );

  const storagePercent = Math.min(
    (storage / storageCapacity) * 100,
    100,
  );

  return (
    <main className="oil-game-shell min-h-screen text-white">
      {/* ================= TOP RESOURCE BAR ================= */}
      <header className="oil-topbar">
        <div className="flex min-w-[210px] items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-sky-700/50 bg-slate-900 text-2xl shadow-inner">
            Ã°Å¸â€˜Â¨Ã°Å¸ÂÂ»Ã¢â‚¬ÂÃ°Å¸â€™Â¼
          </div>

          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
              CEO
            </p>

            <p className="truncate text-sm font-black text-white">
              RADAS ENERGY
            </p>

            <div className="mt-1 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md border border-amber-400 bg-amber-500/20 text-[10px] font-black text-amber-300">
                15
              </div>

              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[48%] rounded-full bg-amber-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="oil-resource-strip">
          <div className="oil-resource-card">
            <Coins className="h-7 w-7 text-amber-400" />
            <div>
              <p>RDO TOKEN</p>
              <strong>{tokenBalance.toFixed(2)}</strong>
              <span className="mt-1 block text-[9px] font-bold text-emerald-400">
                CLAIMABLE {claimableRdo.toFixed(2)} RDO
              </span>
            </div>
          </div>

          <div className="oil-resource-card">
            <Fuel className="h-7 w-7 text-amber-500" />
            <div>
              <p>CRUDE OIL</p>
              <strong>
                {storage} <span>BBL</span>
              </strong>
            </div>
          </div>

          <div className="oil-resource-card hidden lg:flex">
            <CircleDollarSign className="h-7 w-7 text-emerald-400" />
            <div>
              <p>OIL VALUE</p>
              <strong>
                {(storage * OIL_PRICE).toFixed(2)}{" "}
                <span>RDO</span>
              </strong>
            </div>
          </div>

          <div className="oil-resource-card hidden xl:flex">
            <Gem className="h-7 w-7 text-violet-400" />
            <div>
              <p>PLATFORM</p>
              <strong>
                LV.{storageLevel}
              </strong>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <WalletConnectButton />

          <div
            className="relative z-[100] flex min-w-[190px] items-center gap-2 rounded-xl border border-emerald-400/40 bg-[#07111f] px-3 py-2 shadow-xl"
            data-rdo-standalone-claim="true"
          >
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400">
                RDO Claim
              </div>
              <div className="text-[9px] font-bold text-slate-400">
                {claimableRdo.toFixed(2)} RDO available
              </div>
            </div>

            <div className="ml-auto min-w-[112px]">
              <RdoRewardClaim
                claimableRdo={claimableRdo}
                onClaimCompleted={completeStandaloneRdoClaim}
              />
            </div>
          </div>

          <button className="oil-icon-button">
            <Trophy className="h-5 w-5 text-amber-400" />
          </button>

          <button className="oil-icon-button">
            <MessageSquare className="h-5 w-5" />
          </button>

          <button className="oil-icon-button">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="oil-game-layout">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="oil-sidebar hidden lg:flex">
          <div className="space-y-1">
            <button className="oil-side-item oil-side-active">
              <Factory />
              <span>PLATFORM</span>
            </button>

            <button className="oil-side-item">
              <Gauge />
              <span>WELLS</span>
              <span className="oil-menu-badge">
                {activeWells.length}
              </span>
            </button>

            <button className="oil-side-item">
              <Boxes />
              <span>STORAGE</span>
            </button>

            <button className="oil-side-item opacity-50">
              <Building2 />
              <span>REFINERY</span>
              <LockKeyhole className="ml-auto h-4 w-4" />
            </button>

            <button className="oil-side-item opacity-50">
              <PackageOpen />
              <span>SHIPMENT</span>
              <LockKeyhole className="ml-auto h-4 w-4" />
            </button>

            <button className="oil-side-item">
              <BarChart3 />
              <span>MARKET</span>
            </button>

            <button className="oil-side-item opacity-60">
              <Landmark />
              <span>CONTRACT</span>
            </button>

            <button className="oil-side-item">
              <Wrench />
              <span>UPGRADES</span>
            </button>

            <button className="oil-side-item opacity-60">
              <Activity />
              <span>MISSIONS</span>
            </button>

            <button className="oil-side-item opacity-60">
              <ShoppingCart />
              <span>SHOP</span>
            </button>
          </div>

          <div className="mt-auto rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-amber-950/40 p-4">
            <p className="text-sm font-black">
              PLATFORM STATUS
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Offshore production online
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              SYSTEM ACTIVE
            </div>
          </div>
        </aside>

        {/* ================= MAIN GAME AREA ================= */}
        <section className="oil-platform-screen min-w-0">
          {/* HERO */}
          <div className="oil-platform-hero">
            <div className="absolute inset-0 bg-gradient-to-r from-[#03182d]/95 via-[#07365d]/55 to-[#03182d]/75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02101d] via-transparent to-transparent" />

            <div className="oil-platform-silhouette">
              <div className="oil-flare">Ã°Å¸â€Â¥</div>
              <Factory className="h-32 w-32 md:h-44 md:w-44" />
            </div>

            <div className="oil-hero-content relative z-10 flex h-full flex-col justify-between p-5 md:p-7">
              <div className="flex flex-col justify-between gap-5 xl:flex-row">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
                    Offshore Production Zone
                  </p>

                  <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                    PLATFORM A-01
                  </h1>

                  <p className="mt-1 text-sm text-sky-100/70">
                    South China Sea
                  </p>

                  <div className="oil-output-panel mt-5 w-full max-w-sm rounded-xl border border-sky-700/40 bg-[#03162a]/85 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Fuel className="h-4 w-4 text-amber-400" />
                        OIL OUTPUT
                      </div>

                      <span className="rounded bg-emerald-500/20 px-2 py-1 text-[10px] font-black text-emerald-400">
                        ACTIVE
                      </span>
                    </div>

                    <div className="mt-3 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Output Rate
                        </span>
                        <strong className="text-amber-300">
                          {totalOutput} BBL / CYCLE
                        </strong>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Platform Storage
                        </span>
                        <strong>
                          {storage} / {storageCapacity} BBL
                        </strong>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Active Wells
                        </span>
                        <strong className="text-emerald-400">
                          {activeWells.length}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MARKET */}
                <div className="oil-market-panel w-full self-start rounded-xl border border-sky-700/40 bg-[#03162a]/90 p-5 shadow-2xl backdrop-blur-md xl:w-80">
                  <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
                    <BarChart3 className="h-5 w-5 text-sky-400" />
                    <p className="font-black">
                      OIL MARKET
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-400">
                      RADAS Crude Index
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      {OIL_PRICE.toFixed(2)}
                    </p>

                    <p className="mt-1 text-xs font-bold text-emerald-400">
                      RDO / BBL
                    </p>
                  </div>

                  <div className="oil-market-chart mt-5 flex h-14 items-end gap-1">
                    {[28, 39, 32, 50, 44, 61, 54, 72, 63, 78, 68, 88].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t bg-emerald-400/70"
                          style={{ height: `${height}%` }}
                        />
                      ),
                    )}
                  </div>

                  <p className="mt-3 border-t border-slate-700/60 pt-3 text-[10px] text-slate-500">
                    Internal game market price
                  </p>
                </div>
              </div>
            </div>

            {/* PATCH 016D: compact gameplay dock */}
            <div className="oil-hero-game-dock">
              <div className="oil-dock-wells">
                {wells.slice(0, 3).map((well) => {
                  const isReady = well.status === "Ready";
                  const isLocked = well.status === "Locked";
                  const isDamaged = well.status === "Damaged";
                  const missingDurability = Math.max(
                    0,
                    well.maxDurability - well.durability,
                  );
                  const repairCost = Math.max(
                    1,
                    Math.ceil(
                      missingDurability * REPAIR_COST_PER_POINT,
                    ),
                  );
                  const storageFull =
                    isReady && storage + well.output > storageCapacity;

                  return (
                    <article
                      key={well.id}
                      className={`oil-dock-well ${
                        isReady ? "oil-dock-well-ready" : ""
                      } ${isDamaged ? "oil-dock-well-damaged" : ""}`}
                    >
                      <div className="oil-dock-well-visual">
                        <img
                          src="/oil-pumpjack-icon.svg"
                          alt=""
                          className={isLocked ? "is-locked" : ""}
                        />
                        <i
                          className={`oil-dock-status ${
                            isLocked
                              ? "oil-dock-status-locked"
                              : isDamaged
                                ? "oil-dock-status-damaged"
                                : isReady
                                  ? "oil-dock-status-ready"
                                  : "oil-dock-status-active"
                          }`}
                        />
                      </div>

                      <div className="oil-dock-well-head">
                        <div>
                          <p>{well.name.toUpperCase()}</p>
                          <span>
                            {well.tier.toUpperCase()} / LV.{well.level}
                          </span>
                          <em
                            className={`oil-well-class oil-well-class-${getWellClass(
                              well.tier,
                            ).toLowerCase().replace(" ", "-")}`}
                          >
                            {getWellClass(well.tier)}
                          </em>
                        </div>
                      </div>

                      <div className="oil-dock-well-body">
                        <div>
                          <strong>{isLocked ? "--" : well.output} BBL</strong>
                          <small>
                            {isLocked
                              ? "LOCKED"
                              : isDamaged
                                ? "REPAIR REQUIRED"
                                : isReady
                                  ? "READY TO COLLECT"
                                  : formatTime(well.secondsLeft)}
                          </small>

                          {!isLocked && (
                            <div className="oil-dock-durability">
                              <span>
                                DURABILITY {well.durability}/{well.maxDurability}
                              </span>
                              <div>
                                <i
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        (well.durability / well.maxDurability) * 100,
                                      ),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        className="oil-dock-upgrade-button"
                        onClick={() => setProgressWellId(well.id)}
                        disabled={isLocked}
                      >
                        {well.level >= MAX_WELL_LEVEL
                          ? getWellPromotion(well)
                            ? "PROMOTE CLASS"
                            : "MAX CLASS"
                          : `UPGRADE LV.${well.level + 1}`}
                      </button>

                      <button
                        onClick={() =>
                          isLocked
                            ? unlockWell(well.id)
                            : isDamaged
                              ? repairWell(well.id)
                              : collectOil(well.id)
                        }
                        disabled={
                          isLocked
                            ? tokenBalance < 50
                            : isDamaged
                              ? tokenBalance < repairCost
                              : !isReady || storageFull
                        }
                        className={
                          isDamaged
                            ? "is-repair"
                            : isReady && !storageFull
                              ? "is-ready"
                              : ""
                        }
                      >
                        {isLocked
                          ? tokenBalance >= 50
                            ? "UNLOCK - 50 RDO"
                            : "NEED 50 RDO"
                          : isDamaged
                            ? tokenBalance >= repairCost
                              ? `REPAIR - ${repairCost} RDO`
                              : `NEED ${repairCost} RDO`
                            : storageFull
                              ? "STORAGE FULL"
                              : isReady
                                ? "COLLECT"
                                : "EXTRACTING"}
                      </button>
                    </article>
                  );
                })}

                <article className="oil-dock-new-well">
                  <button onClick={() => setMintOpen(true)}>
                    <div className="oil-dock-new-well-icon">
                      <img src="/oil-pumpjack-icon.svg" alt="" />
                      <span>+</span>
                    </div>
                    <strong>MINT WELL</strong>
                    <small>STARTER / STANDARD</small>
                    <b>OPEN MINT</b>
                  </button>
                </article>
              </div>

              <aside className="oil-dock-sell">
                <div className="oil-dock-sell-head">
                  <div>
                    <p>QUICK SELL</p>
                    <strong>{storage} BBL</strong>
                  </div>
                  <CircleDollarSign />
                </div>

                <div className="oil-dock-sell-price">
                  <span>MARKET PRICE</span>
                  <strong>{OIL_PRICE.toFixed(2)} RDO / BBL</strong>
                </div>

                <div className="oil-dock-sell-actions">
                  <button onClick={sellOil} disabled={storage < SELL_AMOUNT}>
                    SELL 10
                  </button>
                  <button onClick={sellAllOil} disabled={storage <= 0}>
                    SELL ALL
                  </button>
                </div>
              </aside>
            </div>

            {progressWell && (
              <div
                className="oil-progress-backdrop"
                onClick={() => setProgressWellId(null)}
              >
                <section
                  className="oil-progress-modal"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="oil-progress-header">
                    <div>
                      <small>WELL PROGRESSION</small>
                      <h2>{progressWell.name}</h2>
                    </div>
                    <button onClick={() => setProgressWellId(null)}>
                      CLOSE
                    </button>
                  </div>

                  <div className="oil-progress-body">
                    <img
                      className="oil-progress-rig"
                      src="/oil-pumpjack-icon.svg"
                      alt=""
                    />

                    <div className="oil-progress-title">
                      <span>{progressWell.tier.toUpperCase()} WELL</span>
                      <strong>{getWellClass(progressWell.tier)}</strong>
                      <b>LV.{progressWell.level} / {MAX_WELL_LEVEL}</b>
                    </div>

                    <div
                      style={{
                        margin: "0 0 10px",
                        padding: "7px 9px",
                        border: "1px solid rgba(34, 211, 238, .12)",
                        borderRadius: "7px",
                        background: "rgba(2, 6, 23, .24)",
                        fontSize: "8px",
                        color: "#64748b",
                        lineHeight: 1.6,
                      }}
                    >
                      <div>
                        ASSET ID:{" "}
                        <strong style={{ color: "#94a3b8" }}>
                          {progressWell.assetId}
                        </strong>
                      </div>
                      <div>
                        OWNER:{" "}
                        <strong style={{ color: "#22d3ee" }}>
                          {progressWell.ownerId === LOCAL_PLAYER_ID
                            ? "YOU / LOCAL PLAYER"
                            : progressWell.ownerId}
                        </strong>
                        {"  |  "}
                        ACQUIRED:{" "}
                        <strong style={{ color: "#94a3b8" }}>
                          {progressWell.acquisitionType.toUpperCase()}
                        </strong>
                      </div>
                    </div>

                    <div className="oil-progress-stats">
                      <div>
                        <small>OUTPUT</small>
                        <strong>{progressWell.output} BBL</strong>
                      </div>
                      <div>
                        <small>CYCLE</small>
                        <strong>{progressWell.cycleSeconds}s</strong>
                      </div>
                      <div>
                        <small>DURABILITY</small>
                        <strong>
                          {progressWell.durability}/{progressWell.maxDurability}
                        </strong>
                      </div>
                    </div>

                    {progressWell.level < MAX_WELL_LEVEL ? (
                      <>
                        <div className="oil-progress-next">
                          <span>NEXT LV.{progressWell.level + 1}</span>
                          <span>
                            +{Math.round(
                              UPGRADE_OUTPUT_MULTIPLIERS[progressWell.level] *
                                100,
                            )}% OUTPUT
                          </span>
                          <span>
                            {UPGRADE_CYCLE_MULTIPLIERS[progressWell.level] > 0
                              ? `-${Math.round(
                                  UPGRADE_CYCLE_MULTIPLIERS[
                                    progressWell.level
                                  ] * 100,
                                )}% CYCLE`
                              : "CYCLE UNCHANGED"}
                          </span>
                        </div>

                        <button
                          className="oil-progress-upgrade"
                          onClick={() => upgradeWell(progressWell.id)}
                          disabled={
                            progressUpgradeCost <= 0 ||
                            tokenBalance < progressUpgradeCost ||
                            progressWell.status === "Damaged"
                          }
                        >
                          {progressWell.status === "Damaged"
                            ? "REPAIR WELL FIRST"
                            : progressUpgradeCost <= 0
                              ? "STARTER UPGRADE LOCKED"
                              : tokenBalance >= progressUpgradeCost
                                ? `UPGRADE - ${progressUpgradeCost} RDO`
                                : `NEED ${progressUpgradeCost} RDO`}
                        </button>
                      </>
                    ) : progressPromotion ? (
                      <div className="oil-promotion-zone">
                        <div className="oil-promotion-heading">
                          <small>CLASS PROMOTION READY</small>
                          <strong>
                            {getWellClass(progressWell.tier)}
                            {" -> "}
                            {getWellClass(progressPromotion.nextTier)}
                          </strong>
                          <span>
                            {progressWell.tier.toUpperCase()}
                            {" -> "}
                            {progressPromotion.nextTier.toUpperCase()}
                          </span>
                        </div>

                        <div className="oil-promotion-preview">
                          <div><small>NEW OUTPUT</small><strong>{progressPromotion.output} BBL</strong></div>
                          <div><small>NEW CYCLE</small><strong>{progressPromotion.cycleSeconds}s</strong></div>
                          <div><small>MAX DURABILITY</small><strong>{progressPromotion.maxDurability}</strong></div>
                        </div>

                        <div className="oil-promotion-cost">
                          <span>{progressPromotion.rdoCost.toLocaleString()} RDO</span>
                          <span>{progressPromotion.oilCost.toLocaleString()} BBL</span>
                        </div>

                        <button
                          className="oil-promote-button"
                          onClick={() => promoteWell(progressWell.id)}
                          disabled={!canAffordPromotion}
                        >
                          {canAffordPromotion
                            ? `PROMOTE TO ${getWellClass(progressPromotion.nextTier).toUpperCase()}`
                            : "INSUFFICIENT RDO / OIL"}
                        </button>

                        <p className="oil-promotion-note">
                          Promotion resets this Well to LV.1 of the new production class.
                        </p>
                      </div>
                    ) : (
                      <div className="oil-progress-max">
                        LEGENDARY CLASS / MAX PROGRESSION
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {mintOpen && (
              <div
                className="oil-mint-backdrop"
                onClick={() => setMintOpen(false)}
              >
                <section
                  className="oil-mint-modal"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="oil-mint-header">
                    <div>
                      <small>RADAS ASSET MINT</small>
                      <h2>MINT WELL</h2>
                    </div>
                    <button onClick={() => setMintOpen(false)}>
                      CLOSE
                    </button>
                  </div>

                  <div className="oil-mint-grid">
                    <article className="oil-mint-card">
                      <div className="oil-mint-rig">
                        <img src="/oil-pumpjack-icon.svg" alt="" />
                      </div>

                      <span className="oil-mint-tier">STARTER WELL</span>
                      <strong>FREE</strong>

                      <div className="oil-mint-stats">
                        <span>{STARTER_WELL_OUTPUT} BBL / CYCLE</span>
                        <span>{STARTER_WELL_CYCLE_SECONDS}s CYCLE</span>
                        <span>100 DURABILITY</span>
                        <span>CLASS: STARTER</span>
                      </div>

                      <button
                        onClick={mintStarterWell}
                        disabled={hasClaimedStarterWell}
                      >
                        {hasClaimedStarterWell
                          ? "STARTER CLAIMED"
                          : "CLAIM FREE WELL"}
                      </button>

                      <p>One free Starter Well per player.</p>
                    </article>

                    <article className="oil-mint-card oil-mint-card-standard">
                      <div className="oil-mint-rig">
                        <img src="/oil-pumpjack-icon.svg" alt="" />
                      </div>

                      <span className="oil-mint-tier">STANDARD WELL</span>
                      <strong>
                        USD {STANDARD_WELL_USD_REFERENCE}
                      </strong>

                      <div className="oil-mint-stats">
                        <span>{STANDARD_WELL_OUTPUT} BBL / CYCLE</span>
                        <span>{STANDARD_WELL_CYCLE_SECONDS}s CYCLE</span>
                        <span>100 DURABILITY</span>
                        <span>CLASS: COMMON</span>
                      </div>

                      <button
                        onClick={mintStandardWell}
                        disabled={tokenBalance < STANDARD_WELL_MINT_COST}
                      >
                        {tokenBalance >= STANDARD_WELL_MINT_COST
                          ? `MINT - ${STANDARD_WELL_MINT_COST} RDO`
                          : `NEED ${STANDARD_WELL_MINT_COST} RDO`}
                      </button>

                      <p>
                        USD100 is the target paid tier. V1 uses
                        {` ${STANDARD_WELL_MINT_COST} RDO `}
                        as the local prototype mint cost.
                      </p>
                    </article>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* PLAYER STATS */}
          <div className="oil-stats-grid">
            <div className="oil-stat-card">
              <span className="oil-stat-icon">Ã°Å¸â€ºÂ¢Ã¯Â¸Â</span>
              <div>
                <p>OIL PRODUCED</p>
                <strong>
                  {stats.totalOilProduced}{" "}
                  <span>BBL</span>
                </strong>
              </div>
            </div>

            <div className="oil-stat-card">
              <Fuel className="text-amber-400" />
              <div>
                <p>OIL SOLD</p>
                <strong>
                  {stats.totalOilSold}{" "}
                  <span>BBL</span>
                </strong>
              </div>
            </div>

            <div className="oil-stat-card">
              <span className="text-2xl text-emerald-400">Ã¢â€ â€˜</span>
              <div>
                <p>TOKEN EARNED</p>
                <strong className="text-emerald-400">
                  {stats.totalTokenEarned.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="oil-stat-card">
              <span className="text-2xl text-red-400">Ã¢â€ â€œ</span>
              <div>
                <p>TOKEN SPENT</p>
                <strong className="text-red-400">
                  {stats.totalTokenSpent.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="oil-stat-card">
              <Factory className="text-sky-300" />
              <div>
                <p>TOTAL WELLS</p>
                <strong>{wells.length}</strong>
              </div>
            </div>
          </div>

          {/* GAME CONTENT */}
          <div className="oil-platform-extra grid gap-3 p-3 xl:grid-cols-[1fr_310px]">
            <div className="min-w-0">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {wells.map((well) => {
                  const isReady = well.status === "Ready";
                  const isLocked = well.status === "Locked";
                  const upgradeCost = well.level * 25;

                  const canUpgrade =
                    !isLocked &&
                    tokenBalance >= upgradeCost;

                  const storageFull =
                    isReady &&
                    storage + well.output > storageCapacity;

                  const progress =
                    isLocked
                      ? 0
                      : isReady
                        ? 100
                        : Math.max(
                            5,
                            ((well.cycleSeconds -
                              well.secondsLeft) /
                              well.cycleSeconds) *
                              100,
                          );

                  return (
                    <article
                      key={well.id}
                      className={`oil-well-card ${
                        isReady ? "oil-well-ready" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-black">
                            {well.name.toUpperCase()}
                          </h3>

                          <p className="mt-1 text-xs font-black text-amber-400">
                            LEVEL {well.level}
                          </p>
                        </div>

                        <span
                          className={`h-3 w-3 rounded-full ${
                            isLocked
                              ? "bg-slate-600"
                              : isReady
                                ? "bg-emerald-400 shadow-[0_0_12px_#34d399]"
                                : "bg-amber-400 shadow-[0_0_12px_#fbbf24]"
                          }`}
                        />
                      </div>

                      <div className="oil-pumpjack">
                        {isLocked ? (
                          <LockKeyhole className="h-16 w-16 text-slate-600" />
                        ) : (
                          <>
                            <span className="text-7xl drop-shadow-xl">
                              Ã°Å¸Ââ€”Ã¯Â¸Â
                            </span>
                            <span className="absolute bottom-4 text-3xl">
                              Ã°Å¸â€ºÂ¢Ã¯Â¸Â
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          <p className="text-xl font-black">
                            {isLocked ? "--" : well.output}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              BBL / CYCLE
                            </span>
                          </p>

                          <p
                            className={`mt-1 text-xs font-bold ${
                              isReady
                                ? "text-emerald-400"
                                : isLocked
                                  ? "text-slate-500"
                                  : "text-sky-300"
                            }`}
                          >
                            {well.status.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isReady
                              ? "bg-emerald-400"
                              : "bg-sky-500"
                          }`}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-sm">
                        <span className="text-slate-400">
                          Cycle
                        </span>

                        <strong>
                          {isLocked
                            ? "--:--"
                            : isReady
                              ? "READY"
                              : formatTime(well.secondsLeft)}
                        </strong>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (isLocked) {
                              unlockWell(well.id);
                              return;
                            }

                            collectOil(well.id);
                          }}
                          disabled={
                            isLocked
                              ? tokenBalance < 50
                              : !isReady || storageFull
                          }
                          className={`oil-action-button ${
                            isLocked
                              ? tokenBalance >= 50
                                ? "oil-button-blue col-span-2"
                                : "oil-button-disabled col-span-2"
                              : isReady && !storageFull
                                ? "oil-button-green"
                                : "oil-button-disabled"
                          }`}
                        >
                          {isLocked
                            ? tokenBalance >= 50
                              ? "UNLOCK 50"
                              : "NEED 50"
                            : storageFull
                              ? "FULL"
                              : isReady
                                ? "COLLECT"
                                : "EXTRACTING"}
                        </button>

                        {!isLocked && (
                          <button
                            onClick={() =>
                              upgradeWell(well.id)
                            }
                            disabled={!canUpgrade}
                            className={`oil-action-button ${
                              canUpgrade
                                ? "oil-button-blue"
                                : "oil-button-disabled"
                            }`}
                          >
                            UPGRADE
                          </button>
                        )}
                      </div>

                      {!isLocked && (
                        <p className="mt-2 text-center text-[10px] text-slate-500">
                          Upgrade Cost: {upgradeCost} TOKEN
                        </p>
                      )}
                    </article>
                  );
                })}

                {/* BUY WELL */}
                <article className="oil-new-well-card">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-sky-700 bg-sky-950/50 text-5xl font-light text-slate-400">
                    +
                  </div>

                  <h3 className="mt-4 text-lg font-black">
                    NEW WELL
                  </h3>

                  <p className="mt-2 max-w-[190px] text-center text-sm leading-relaxed text-slate-400">
                    Add a new oil well to expand production.
                  </p>

                  <button
                    onClick={buyNewWell}
                    disabled={!canBuyWell}
                    className={`mt-6 w-full rounded-lg px-4 py-3 text-sm font-black ${
                      canBuyWell
                        ? "bg-gradient-to-b from-amber-300 to-amber-500 text-[#09213a] hover:brightness-110"
                        : "cursor-not-allowed bg-slate-800 text-slate-500"
                    }`}
                  >
                    BUY WELL
                    <span className="mt-1 block text-xs">
                      {newWellCost} TOKEN
                    </span>
                  </button>
                </article>
              </div>

              {/* STORAGE + SELL */}
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="oil-panel">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="oil-panel-label">
                        STORAGE FACILITY
                      </p>

                      <h3 className="mt-1 text-xl font-black">
                        LEVEL {storageLevel}
                      </h3>
                    </div>

                    <Boxes className="h-8 w-8 text-amber-400" />
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-400">
                        Crude Capacity
                      </span>

                      <strong>
                        {storage} / {storageCapacity} BBL
                      </strong>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                        style={{
                          width: `${storagePercent}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={upgradeStorage}
                    disabled={
                      tokenBalance < storageLevel * 40
                    }
                    className={`mt-5 w-full rounded-lg px-4 py-3 text-sm font-black ${
                      tokenBalance >= storageLevel * 40
                        ? "oil-button-blue"
                        : "oil-button-disabled"
                    }`}
                  >
                    UPGRADE STORAGE Ã¢â‚¬â€ {storageLevel * 40} TOKEN
                  </button>
                </div>

                <div className="oil-panel">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="oil-panel-label">
                        QUICK SELL
                      </p>

                      <h3 className="mt-1 text-xl font-black">
                        CRUDE MARKET
                      </h3>
                    </div>

                    <CircleDollarSign className="h-8 w-8 text-emerald-400" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-black/20 p-3">
                      <p className="text-[10px] uppercase text-slate-500">
                        Storage
                      </p>
                      <strong className="text-lg">
                        {storage} BBL
                      </strong>
                    </div>

                    <div className="rounded-lg bg-black/20 p-3">
                      <p className="text-[10px] uppercase text-slate-500">
                        Price
                      </p>
                      <strong className="text-lg text-emerald-400">
                        {OIL_PRICE.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={storage}
                      step="1"
                      value={sellAmount}
                      onChange={(event) =>
                        setSellAmount(event.target.value)
                      }
                      className="min-w-0 flex-1 rounded-lg border border-sky-900 bg-[#03162a] px-3 py-2 text-sm outline-none focus:border-sky-500"
                    />

                    <button
                      onClick={sellCustomOil}
                      disabled={
                        !Number.isFinite(
                          Number(sellAmount),
                        ) ||
                        Math.floor(
                          Number(sellAmount),
                        ) <= 0 ||
                        Math.floor(
                          Number(sellAmount),
                        ) > storage
                      }
                      className="rounded-lg bg-sky-600 px-4 text-xs font-black hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                    >
                      SELL
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={sellOil}
                      disabled={storage < SELL_AMOUNT}
                      className="oil-action-button oil-button-green disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                    >
                      SELL 10 BBL
                    </button>

                    <button
                      onClick={sellAllOil}
                      disabled={storage <= 0}
                      className="oil-action-button bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                    >
                      SELL ALL
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <aside className="oil-panel self-start">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div>
                  <p className="oil-panel-label">
                    RECENT ACTIVITY
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest 20 transactions
                  </p>
                </div>

                <Activity className="h-5 w-5 text-sky-400" />
              </div>

              <div className="mt-2">
                {transactions.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-500">
                    No transactions yet.
                  </div>
                ) : (
                  transactions
                    .slice(0, 8)
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex gap-3 border-b border-slate-800 py-3 last:border-0"
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            transaction.type ===
                            "income"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {transaction.type ===
                          "income"
                            ? "Ã¢â€ â€˜"
                            : "Ã¢â€ â€œ"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-snug">
                            {transaction.description}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-500">
                            {new Date(
                              transaction.createdAt,
                            ).toLocaleString()}
                          </p>
                        </div>

                        <p
                          className={`whitespace-nowrap text-xs font-black ${
                            transaction.type ===
                            "income"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {transaction.type ===
                          "income"
                            ? "+"
                            : "-"}
                          {transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </aside>
          </div>
        </section>
      </div>

      {/* ================= BOTTOM NAV ================= */}
      <nav className="oil-bottom-nav">
        <button className="oil-bottom-active">
          <HomeIcon />
          <span>HOME</span>
        </button>

        <button>
          <CircleDollarSign />
          <span>FINANCE</span>
        </button>

        <button>
          <Users />
          <span>CLAN</span>
        </button>

        <button>
          <Trophy />
          <span>LEADERBOARD</span>
        </button>

        <button>
          <Newspaper />
          <span>NEWS</span>
        </button>

        <button>
          <MessageSquare />
          <span>CHAT</span>
        </button>
      </nav>
    </main>
  );
}


