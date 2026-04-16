import type { InterfaceAbi } from "ethers"

/**
 * Factory ABI candidates for stream deployment.
 * We include multiple method shapes to support common factory contract variants.
 */
export const streamFactoryAbi: InterfaceAbi = [
  // ─── Deployed StreamFactory.sol signature (salary = msg.value, NOT a param) ──
  "function createStream(address worker,uint256 totalDuration,uint8 paymentPeriod) payable returns (address)",

  // Fallback candidate deploy methods (4-param variants for other factory versions)
  "function createStream(address worker,uint256 totalSalary,uint256 totalDuration,uint8 paymentPeriod) payable returns (address)",
  "function createStream(address worker,uint256 totalSalary,uint256 totalDuration) payable returns (address)",
  "function deployStream(address worker,uint256 totalSalary,uint256 totalDuration,uint8 paymentPeriod) payable returns (address)",
  "function deployStream(address worker,uint256 totalSalary,uint256 totalDuration) payable returns (address)",
  "function createSalaryStream(address worker,uint256 totalSalary,uint256 totalDuration,uint8 paymentPeriod) payable returns (address)",
  "function createSalaryStream(address worker,uint256 totalSalary,uint256 totalDuration) payable returns (address)",

  // Candidate deploy methods (explicit employer arg)
  "function createStream(address employer,address worker,uint256 totalSalary,uint256 totalDuration,uint8 paymentPeriod) payable returns (address)",
  "function deployStream(address employer,address worker,uint256 totalSalary,uint256 totalDuration,uint8 paymentPeriod) payable returns (address)",

  // ─── Factory read methods (from StreamFactory.sol) ────────────────────────
  "function getAllStreams() view returns (address[])",
  "function getStreamsByEmployer(address employer) view returns (address[])",
  "function getStreamsByWorker(address worker) view returns (address[])",
  "function getStreamCount() view returns (uint256)",
  "function getEmployerStreamCount(address employer) view returns (uint256)",
  "function getWorkerStreamCount(address worker) view returns (uint256)",
  "function getStreamRecord(address stream) view returns (address,address,address,uint256,uint256,uint8,uint256)",

  // ─── Events ───────────────────────────────────────────────────────────────
  "event StreamCreated(address indexed stream,address indexed employer,address indexed worker,uint256 totalSalary,uint256 totalDuration,uint8 paymentPeriod,uint256 createdAt)",
]

