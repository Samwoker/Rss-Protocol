import {
  formatEther,
  getAddress,
  isAddress,
  parseEther,
  type ContractTransactionResponse,
  type TransactionReceipt,
  Interface,
} from "ethers";
import {
  getBrowserProvider,
  getFactoryWriteContract,
  getFactoryReadContract,
  getStreamReadContract,
  getStreamReadContractAt,
  getStreamWriteContract,
} from "./client";
import { streamFactoryAbi } from "./abi/factoryAbi";

type ContractMethods = Record<string, (...args: unknown[]) => Promise<unknown>>;
type StreamStatus = number;
type PaymentPeriod = number;

export type StreamFrequency = "Weekly" | "Bi-weekly" | "Monthly";

export interface DeployStreamParams {
  employer?: string;
  worker: string;
  salaryEth: string;
  durationDays: number;
  frequency: StreamFrequency;
}

export interface StreamContractSnapshot {
  employer: string;
  worker: string;
  totalSalary: bigint;
  totalDuration: bigint;
  deployTime: bigint;
  workStartTime: bigint;
  lastClaimTime: bigint;
  amountWithdrawn: bigint;
  paymentPeriod: PaymentPeriod;
  status: StreamStatus;
  earned: bigint;
  withdrawable: bigint;
  timeUntilNextClaim: bigint;
  contractBalance: bigint;
  periodDuration: bigint;
}

export async function readStreamMethod<T = unknown>(
  methodName: string,
  ...args: unknown[]
): Promise<T> {
  const contract = getStreamReadContract() as unknown as ContractMethods;
  const method = contract[methodName];

  if (typeof method !== "function") {
    throw new Error(
      `Read method "${methodName}" was not found in the provided ABI.`,
    );
  }

  return (await method(...args)) as T;
}

export async function writeStreamMethod(
  methodName: string,
  ...args: unknown[]
): Promise<ContractTransactionResponse> {
  const contract =
    (await getStreamWriteContract()) as unknown as ContractMethods;
  const method = contract[methodName];

  if (typeof method !== "function") {
    throw new Error(
      `Write method "${methodName}" was not found in the provided ABI.`,
    );
  }

  const tx = await method(...args);
  return tx as ContractTransactionResponse;
}

/** Read a method on a specific stream address (not the "active" one). */
export async function readStreamMethodAt<T = unknown>(
  address: string,
  methodName: string,
  ...args: unknown[]
): Promise<T> {
  const contract = getStreamReadContractAt(
    address,
  ) as unknown as ContractMethods;
  const method = contract[methodName];

  if (typeof method !== "function") {
    throw new Error(
      `Read method "${methodName}" was not found in the provided ABI.`,
    );
  }

  return (await method(...args)) as T;
}

const SECONDS_PER_DAY = 24 * 60 * 60;

const frequencyToPaymentPeriod = (
  frequency: StreamFrequency,
): PaymentPeriod => {
  if (frequency === "Weekly") return 0;
  if (frequency === "Bi-weekly") return 1;
  return 2;
};

const normalizeRequiredAddress = (address: string, label: string): string => {
  const trimmed = address.trim();
  if (!isAddress(trimmed)) {
    throw new Error(`Invalid ${label} address.`);
  }
  return getAddress(trimmed);
};

const normalizeOptionalAddress = (address?: string): string | null => {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  if (!isAddress(trimmed)) {
    throw new Error("Invalid employer address.");
  }
  return getAddress(trimmed);
};

const isUserRejectedError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: string | number;
    shortMessage?: string;
    message?: string;
  };
  const normalizedMessage = `${
    candidate.shortMessage ?? candidate.message ?? ""
  }`.toLowerCase();

  return (
    candidate.code === 4001 ||
    candidate.code === "ACTION_REJECTED" ||
    normalizedMessage.includes("user rejected")
  );
};

const isInsufficientFundsError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: string | number;
    shortMessage?: string;
    message?: string;
    info?: {
      error?: {
        code?: string | number;
        message?: string;
      };
    };
  };

  const normalizedMessage = `${candidate.shortMessage ?? ""} ${
    candidate.message ?? ""
  } ${candidate.info?.error?.message ?? ""}`.toLowerCase();

  return (
    candidate.code === "INSUFFICIENT_FUNDS" ||
    candidate.code === -32003 ||
    candidate.info?.error?.code === -32003 ||
    normalizedMessage.includes("insufficient funds")
  );
};

const formatEthDisplay = (value: bigint): string => {
  const asNumber = Number(formatEther(value));
  if (!Number.isFinite(asNumber)) {
    return formatEther(value);
  }
  return asNumber.toFixed(6);
};

/**
 * Attempt to decode a Solidity revert reason from a variety of RPC/ethers
 * error shapes where the raw revert bytes may be present.
 *
 * This is intentionally defensive and best-effort: RPC providers and wallet
 * providers sometimes return revert bytes in different fields (e.g. `data`,
 * `error.data`, `info.error.data`). The function looks for hex data and then
 * heuristically extracts an ASCII string from the tail of the payload if the
 * standard Error(string) selector is present. If nothing useful is found it
 * returns null.
 */
function decodeRevertReason(errData: unknown): string | null {
  try {
    const data =
      typeof errData === "string" && errData.length > 0
        ? errData
        : typeof errData === "object" && errData !== null
          ? (((errData as Record<string, unknown>)["data"] as
              | string
              | undefined) ??
            ((
              (errData as Record<string, unknown>)["error"] as
                | Record<string, unknown>
                | undefined
            )?.["data"] as string | undefined) ??
            null)
          : null;
    if (!data || typeof data !== "string") {
      return null;
    }

    const hex = data.startsWith("0x") ? data.slice(2) : data;
    if (hex.length < 8) return null;

    // Standard Error(string) selector
    const selector = "08c379a0";
    if (!hex.startsWith(selector)) {
      // Sometimes providers include extra envelope data; try to locate selector in body
      const idx = hex.indexOf(selector);
      if (idx >= 0) {
        // consider the substring from the selector onward
        const tail = hex.slice(idx + selector.length);
        return decodeUtf8FromHex(tail);
      }
      return null;
    }

    // After the selector there are offsets/length fields; the human-readable
    // string bytes are usually near the end of the payload. Extract a tail
    // window and decode printable bytes until a NUL (0x00) is reached.
    const payload = hex.slice(selector.length);
    return decodeUtf8FromHex(payload) || null;
  } catch {
    return null;
  }
}

/** Convert hex payload (no 0x) into a UTF-8 string by reading printable bytes. */
function decodeUtf8FromHex(hex: string): string | null {
  try {
    // Limit the search to the last 512 hex chars to focus on the likely string area.
    const windowed = hex.length > 512 ? hex.slice(hex.length - 512) : hex;
    // Ensure even length
    const cleaned = windowed.length % 2 === 0 ? windowed : "0" + windowed;
    let out = "";
    for (let i = 0; i < cleaned.length; i += 2) {
      const byteHex = cleaned.slice(i, i + 2);
      const code = parseInt(byteHex, 16);
      if (!Number.isFinite(code)) break;
      if (code === 0) break; // NUL terminator
      // Only accept reasonable printable characters; abort on unlikely control bytes
      if (code < 9 || (code > 13 && code < 32)) break;
      out += String.fromCharCode(code);
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

const assertDeployerHasSufficientBalance = async (
  salaryWei: bigint,
): Promise<void> => {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  const balance = await provider.getBalance(signerAddress);

  // Deployment sends salary as payable value, then adds gas on top.
  if (balance <= salaryWei) {
    throw new Error(
      `Insufficient funds. Wallet balance is ${formatEthDisplay(
        balance,
      )} ETH, but deploy requires more than ${formatEthDisplay(
        salaryWei,
      )} ETH (salary + gas).`,
    );
  }
};

async function writeFactoryMethodBySignature(
  methodSignature: string,
  ...args: unknown[]
): Promise<ContractTransactionResponse> {
  const contract =
    (await getFactoryWriteContract()) as unknown as ContractMethods;
  const anyContract = contract as unknown as {
    callStatic?: Record<string, (...args: unknown[]) => Promise<unknown>>;
  } & Record<string, unknown>;
  const method = contract[methodSignature];

  if (typeof method !== "function") {
    throw new Error(
      `Factory method "${methodSignature}" was not found in the provided ABI.`,
    );
  }

  // Try a static call first to capture revert reasons earlier and provide
  // a clearer error message. Many reverts show up during gas estimation;
  // doing a callStatic helps surfacing the EVM revert reason when available.
  try {
    if (
      anyContract.callStatic &&
      typeof anyContract.callStatic[methodSignature] === "function"
    ) {
      // callStatic will run the same execution path but won't create a transaction.
      // If it reverts, it will throw with the revert reason (when available).
      // We pass the same args that will be forwarded to the actual method.
      // Note: if the last argument is an overrides object (e.g. { value }), it should be included.
      // Using apply to forward the arguments array as-is.
      // Invoke the dynamic callStatic overload with the same args we're
      // about to use for the write call. Use the spread operator to forward
      // the arguments array.
      await anyContract.callStatic[methodSignature](...args);
    }
  } catch (staticErr) {
    // Re-throw a clearer error that includes the method signature so the caller
    // can identify which overload or argument set failed.
    // Attempt to extract a human-readable revert reason from common error shapes.
    const rawErr: unknown =
      staticErr instanceof Error ? staticErr : (staticErr as unknown);

    // Prefer explicit reason/message if present
    let decoded: string | null = null;
    if (rawErr && typeof rawErr === "object") {
      const r = rawErr as Record<string, unknown>;
      const reasonField = r["reason"];
      if (typeof reasonField === "string" && reasonField.length > 0) {
        decoded = reasonField;
      }
      if (
        !decoded &&
        typeof r["message"] === "string" &&
        (r["message"] as string).length > 0
      ) {
        decoded = r["message"] as string;
      }
    }

    // Try to decode ABI-encoded revert data from likely locations
    if (!decoded) {
      let candidateData: unknown = null;
      if (rawErr && typeof rawErr === "object") {
        const r = rawErr as Record<string, unknown>;
        candidateData =
          r["data"] ??
          (r["error"] && (r["error"] as Record<string, unknown>)["data"]) ??
          (r["info"] &&
            (r["info"] as Record<string, unknown>)["error"] &&
            (
              (r["info"] as Record<string, unknown>)["error"] as Record<
                string,
                unknown
              >
            )["data"]) ??
          null;
      }
      decoded = decodeRevertReason(candidateData) ?? null;
    }

    const reason =
      decoded ?? (rawErr instanceof Error ? rawErr.message : String(rawErr));
    throw new Error(`Static call failed for ${methodSignature}: ${reason}`);
  }

  const tx = await method(...args);
  return tx as ContractTransactionResponse;
}

export async function deploySalaryStream(
  params: DeployStreamParams,
): Promise<ContractTransactionResponse> {
  const worker = normalizeRequiredAddress(params.worker, "worker");
  const employer = normalizeOptionalAddress(params.employer);

  // Prevent deploying a stream where the employer and worker are identical.
  // The on-chain contract has a require that disallows employer === worker and
  // will revert without a readable reason during callStatic / gas estimation.
  // Validate this client-side and surface a clear error to the user instead.
  if (employer && employer.toLowerCase() === worker.toLowerCase()) {
    throw new Error("Employer and worker addresses must be different.");
  }

  let salaryWei: bigint;
  try {
    salaryWei = parseEther(params.salaryEth.trim());
  } catch {
    throw new Error("Invalid salary amount. Use a valid ETH value.");
  }

  if (salaryWei <= 0n) {
    throw new Error("Salary amount must be greater than 0 ETH.");
  }

  const durationDays = Math.trunc(params.durationDays);
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    throw new Error("Duration must be greater than 0 days.");
  }

  const totalDuration = BigInt(durationDays * SECONDS_PER_DAY);
  const paymentPeriod = frequencyToPaymentPeriod(params.frequency);

  await assertDeployerHasSufficientBalance(salaryWei);

  const candidates: Array<{ signature: string; args: unknown[] }> = [
    // ── The REAL deployed StreamFactory.sol signature (salary = msg.value only) ──
    {
      signature: "createStream(address,uint256,uint8)",
      args: [worker, totalDuration, paymentPeriod],
    },
    // ── Fallback candidates for other factory versions ──
    {
      signature: "createStream(address,uint256,uint256,uint8)",
      args: [worker, salaryWei, totalDuration, paymentPeriod],
    },
    {
      signature: "deployStream(address,uint256,uint256,uint8)",
      args: [worker, salaryWei, totalDuration, paymentPeriod],
    },
    {
      signature: "createSalaryStream(address,uint256,uint256,uint8)",
      args: [worker, salaryWei, totalDuration, paymentPeriod],
    },
    {
      signature: "createStream(address,uint256,uint256)",
      args: [worker, salaryWei, totalDuration],
    },
    {
      signature: "deployStream(address,uint256,uint256)",
      args: [worker, salaryWei, totalDuration],
    },
    {
      signature: "createSalaryStream(address,uint256,uint256)",
      args: [worker, salaryWei, totalDuration],
    },
  ];

  if (employer) {
    candidates.push(
      {
        signature: "createStream(address,address,uint256,uint256,uint8)",
        args: [employer, worker, salaryWei, totalDuration, paymentPeriod],
      },
      {
        signature: "deployStream(address,address,uint256,uint256,uint8)",
        args: [employer, worker, salaryWei, totalDuration, paymentPeriod],
      },
    );
  }

  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      return await writeFactoryMethodBySignature(
        candidate.signature,
        ...candidate.args,
        { value: salaryWei },
      );
    } catch (error) {
      // Log which candidate signature failed along with the error to aid debugging.
      // This will appear in the browser console where DeployPage invokes the call.
      // Keep forwarding user rejection / insufficient funds errors as before.
      console.error(`Factory candidate failed: ${candidate.signature}`, error);
      if (isUserRejectedError(error) || isInsufficientFundsError(error)) {
        throw error;
      }
      lastError = error;
    }
  }

  const lastErrorMessage =
    lastError instanceof Error ? lastError.message : "Unknown deploy error.";
  throw new Error(
    `Unable to deploy stream using known factory methods. Last error: ${lastErrorMessage}`,
  );
}

export async function startWork(): Promise<ContractTransactionResponse> {
  return writeStreamMethod("startWork");
}

export async function clawback(): Promise<ContractTransactionResponse> {
  return writeStreamMethod("clawback");
}

export async function withdrawFromStream(): Promise<ContractTransactionResponse> {
  return writeStreamMethod("withdraw");
}

export async function cancelIfNotStarted(): Promise<ContractTransactionResponse> {
  return writeStreamMethod("cancelIfNotStarted");
}

export async function getEarnedAmount(): Promise<bigint> {
  return readStreamMethod<bigint>("getEarned");
}

export async function getWithdrawableAmount(): Promise<bigint> {
  return readStreamMethod<bigint>("getWithdrawable");
}

export async function getStreamContractSnapshot(): Promise<StreamContractSnapshot> {
  const [
    employer,
    worker,
    totalSalary,
    totalDuration,
    deployTime,
    workStartTime,
    lastClaimTime,
    amountWithdrawn,
    paymentPeriod,
    status,
    earned,
    withdrawable,
    timeUntilNextClaim,
    contractBalance,
    periodDuration,
  ] = await Promise.all([
    readStreamMethod<string>("employer"),
    readStreamMethod<string>("worker"),
    readStreamMethod<bigint>("totalSalary"),
    readStreamMethod<bigint>("totalDuration"),
    readStreamMethod<bigint>("deployTime"),
    readStreamMethod<bigint>("workStartTime"),
    readStreamMethod<bigint>("lastClaimTime"),
    readStreamMethod<bigint>("amountWithdrawn"),
    readStreamMethod<number>("paymentPeriod"),
    readStreamMethod<number>("status"),
    readStreamMethod<bigint>("getEarned"),
    readStreamMethod<bigint>("getWithdrawable"),
    readStreamMethod<bigint>("timeUntilNextClaim"),
    readStreamMethod<bigint>("getContractBalance"),
    readStreamMethod<bigint>("getPeriodDuration"),
  ]);

  return {
    employer,
    worker,
    totalSalary,
    totalDuration,
    deployTime,
    workStartTime,
    lastClaimTime,
    amountWithdrawn,
    paymentPeriod,
    status,
    earned,
    withdrawable,
    timeUntilNextClaim,
    contractBalance,
    periodDuration,
  };
}

/** Get a snapshot for a specific stream address (used by ExplorerPage). */
export async function getStreamSnapshotAt(
  address: string,
): Promise<StreamContractSnapshot> {
  const read = <T>(method: string) => readStreamMethodAt<T>(address, method);

  const [
    employer,
    worker,
    totalSalary,
    totalDuration,
    deployTime,
    workStartTime,
    lastClaimTime,
    amountWithdrawn,
    paymentPeriod,
    status,
    earned,
    withdrawable,
    timeUntilNextClaim,
    contractBalance,
    periodDuration,
  ] = await Promise.all([
    read<string>("employer"),
    read<string>("worker"),
    read<bigint>("totalSalary"),
    read<bigint>("totalDuration"),
    read<bigint>("deployTime"),
    read<bigint>("workStartTime"),
    read<bigint>("lastClaimTime"),
    read<bigint>("amountWithdrawn"),
    read<number>("paymentPeriod"),
    read<number>("status"),
    read<bigint>("getEarned"),
    read<bigint>("getWithdrawable"),
    read<bigint>("timeUntilNextClaim"),
    read<bigint>("getContractBalance"),
    read<bigint>("getPeriodDuration"),
  ]);

  return {
    employer,
    worker,
    totalSalary,
    totalDuration,
    deployTime,
    workStartTime,
    lastClaimTime,
    amountWithdrawn,
    paymentPeriod,
    status,
    earned,
    withdrawable,
    timeUntilNextClaim,
    contractBalance,
    periodDuration,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY READ HELPERS (for ExplorerPage)
// ═══════════════════════════════════════════════════════════════════════════════

/** Get all stream addresses ever deployed through the factory. */
export async function getAllStreams(): Promise<string[]> {
  const factory = getFactoryReadContract();
  return (await factory.getAllStreams()) as string[];
}

/** Get stream addresses for a specific employer. */
export async function getStreamsByEmployer(
  employer: string,
): Promise<string[]> {
  const factory = getFactoryReadContract();
  return (await factory.getStreamsByEmployer(employer)) as string[];
}

/** Get stream addresses for a specific worker. */
export async function getStreamsByWorker(worker: string): Promise<string[]> {
  const factory = getFactoryReadContract();
  return (await factory.getStreamsByWorker(worker)) as string[];
}

/** Get the factory's total stream count. */
export async function getStreamCount(): Promise<bigint> {
  const factory = getFactoryReadContract();
  return (await factory.getStreamCount()) as bigint;
}

// Backward-compatible aliases.
/**
 * Parse a mined transaction receipt to extract the address of the newly deployed
 * stream contract. This scans logs for the `StreamCreated` event defined in the
 * factory ABI and returns the `stream` argument when found.
 *
 * Throws when no matching event/address can be located.
 */
export function parseStreamAddressFromReceipt(
  receipt: TransactionReceipt,
): string {
  if (!receipt || !Array.isArray(receipt.logs)) {
    throw new Error("Invalid transaction receipt provided.");
  }

  const iface = new Interface(streamFactoryAbi);

  // Lightweight shape representing the data parseLog expects from a log.
  type LogLike = { topics: string[]; data: string; address?: string };

  for (const log of receipt.logs) {
    try {
      // parseLog will throw if the log doesn't match any event in the ABI
      const parsed = iface.parseLog(log as unknown as LogLike);
      if (parsed && parsed.name === "StreamCreated") {
        // Event signature (Factory ABI):
        // event StreamCreated(address indexed stream, address indexed employer, address indexed worker, uint256 totalSalary, uint256 totalDuration, uint8 paymentPeriod, uint256 createdAt)
        // `parsed.args` is an array-like result; narrow it to a safer typed shape.
        const args = parsed.args as unknown as {
          [key: string]: unknown;
        } & ArrayLike<unknown>;
        const addrCandidate =
          (args["stream"] as unknown as string) ??
          (args[0] as unknown as string);
        if (typeof addrCandidate === "string" && isAddress(addrCandidate)) {
          return getAddress(addrCandidate);
        }
      }
    } catch {
      // ignore parse errors for logs that don't match our ABI events
      continue;
    }
  }

  throw new Error(
    "Unable to find StreamCreated event (stream address) in transaction receipt.",
  );
}

export const readFactoryMethod = readStreamMethod;
export const writeFactoryMethod = writeStreamMethod;
