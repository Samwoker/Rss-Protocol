import type { InterfaceAbi } from "ethers"

/**
 * ABI for the TrustlessSalaryStreamer contract.
 * Source: provided by user.
 * Implements: PENDING -> ACTIVE -> ENDED lifecycle, withdraw, clawback, cancel.
 */
export const streamerAbi: InterfaceAbi = [
  "event ContractFunded(address indexed employer,address indexed worker,uint256 totalSalary,uint256 totalDuration,uint8 paymentPeriod)",
  "event WorkStarted(uint256 startTime)",
  "event Withdrawn(address indexed worker,uint256 amount,uint256 totalWithdrawn)",
  "event Clawback(address indexed employer,uint256 amount)",
  "event ContractCancelled(address indexed worker,uint256 refund)",
  "function employer() view returns (address)",
  "function worker() view returns (address)",
  "function totalSalary() view returns (uint256)",
  "function totalDuration() view returns (uint256)",
  "function deployTime() view returns (uint256)",
  "function workStartTime() view returns (uint256)",
  "function lastClaimTime() view returns (uint256)",
  "function amountWithdrawn() view returns (uint256)",
  "function paymentPeriod() view returns (uint8)",
  "function status() view returns (uint8)",
  "function startWork()",
  "function clawback()",
  "function withdraw()",
  "function cancelIfNotStarted()",
  "function getEarned() view returns (uint256)",
  "function getWithdrawable() view returns (uint256)",
  "function timeUntilNextClaim() view returns (uint256)",
  "function getContractBalance() view returns (uint256)",
  "function getPeriodDuration() view returns (uint256)",
]
