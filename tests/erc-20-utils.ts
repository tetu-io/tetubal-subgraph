import { newMockEvent, createMockedFunction } from 'matchstick-as';
import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { ClearDelegate, ClearDelegate1, SetDelegate } from '../src/types/DelegateRegistry/DelegateRegistry';
import { Transfer } from '../src/types/TetuBalPower/ERC20Abi';
import { Transfer as TetuBalTransfer } from '../src/types/TetuBal/ERC20Abi';
import { Transfer as XTetuBalTransfer } from '../src/types/XTetuBal/ERC20Abi';
import { BALANCER_VAULT, BRIBER, TETU_BAL, TETU_BAL_POWER } from '../src/helpers/constant';

export function mockPowerBalance(account: Address, balance: BigInt): void {
  createMockedFunction(TETU_BAL_POWER, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(account)])
    .returns([ethereum.Value.fromUnsignedBigInt(balance)]);
}

export function mockSnapshotCalls(): void {
  mockSnapshotWith(BigInt.zero(), BigInt.zero(), BigInt.fromI32(1));
}

export function mockSnapshotWith(vaultBalance: BigInt, briberPower: BigInt, totalSupply: BigInt): void {
  createMockedFunction(TETU_BAL, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(BALANCER_VAULT)])
    .returns([ethereum.Value.fromUnsignedBigInt(vaultBalance)]);
  createMockedFunction(TETU_BAL, 'totalSupply', 'totalSupply():(uint256)')
    .returns([ethereum.Value.fromUnsignedBigInt(totalSupply)]);
  mockPowerBalance(BRIBER, briberPower);
}

export function createPowerTransferEvent(
  from: Address,
  to: Address,
  value: BigInt,
  blockNumber: BigInt,
  timestamp: BigInt,
): Transfer {
  const event = changetype<Transfer>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(new ethereum.EventParam('from', ethereum.Value.fromAddress(from)));
  event.parameters.push(new ethereum.EventParam('to', ethereum.Value.fromAddress(to)));
  event.parameters.push(new ethereum.EventParam('value', ethereum.Value.fromUnsignedBigInt(value)));
  event.block.number = blockNumber;
  event.block.timestamp = timestamp;
  return event;
}

export function createTetuBalTransferEvent(
  from: Address,
  to: Address,
  value: BigInt,
  blockNumber: BigInt,
  timestamp: BigInt,
): TetuBalTransfer {
  const event = changetype<TetuBalTransfer>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(new ethereum.EventParam('from', ethereum.Value.fromAddress(from)));
  event.parameters.push(new ethereum.EventParam('to', ethereum.Value.fromAddress(to)));
  event.parameters.push(new ethereum.EventParam('value', ethereum.Value.fromUnsignedBigInt(value)));
  event.block.number = blockNumber;
  event.block.timestamp = timestamp;
  return event;
}

export function createXTetuBalTransferEvent(
  from: Address,
  to: Address,
  value: BigInt,
  blockNumber: BigInt,
  timestamp: BigInt,
  txHash: string,
  tokenAddress: Address | null = null,
): XTetuBalTransfer {
  const event = changetype<XTetuBalTransfer>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(new ethereum.EventParam('from', ethereum.Value.fromAddress(from)));
  event.parameters.push(new ethereum.EventParam('to', ethereum.Value.fromAddress(to)));
  event.parameters.push(new ethereum.EventParam('value', ethereum.Value.fromUnsignedBigInt(value)));
  event.block.number = blockNumber;
  event.block.timestamp = timestamp;
  event.transaction.hash = Bytes.fromHexString(txHash);
  if (tokenAddress) {
    event.address = tokenAddress;
  }
  return event;
}

export function createSetDelegateEvent(
  delegator: Address,
  delegationId: Bytes,
  delegate: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
): SetDelegate {
  const event = changetype<SetDelegate>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(new ethereum.EventParam('delegator', ethereum.Value.fromAddress(delegator)));
  event.parameters.push(new ethereum.EventParam('id', ethereum.Value.fromFixedBytes(delegationId)));
  event.parameters.push(new ethereum.EventParam('delegate', ethereum.Value.fromAddress(delegate)));
  event.block.number = blockNumber;
  event.block.timestamp = timestamp;
  return event;
}

export function createClearDelegateEvent(
  delegator: Address,
  delegationId: Bytes,
  blockNumber: BigInt,
  timestamp: BigInt,
): ClearDelegate {
  const event = changetype<ClearDelegate>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(new ethereum.EventParam('delegator', ethereum.Value.fromAddress(delegator)));
  event.parameters.push(new ethereum.EventParam('id', ethereum.Value.fromFixedBytes(delegationId)));
  event.block.number = blockNumber;
  event.block.timestamp = timestamp;
  return event;
}

export function createClearDelegateWithDelegateEvent(
  delegator: Address,
  delegationId: Bytes,
  delegate: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
): ClearDelegate1 {
  const event = changetype<ClearDelegate1>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(new ethereum.EventParam('delegator', ethereum.Value.fromAddress(delegator)));
  event.parameters.push(new ethereum.EventParam('id', ethereum.Value.fromFixedBytes(delegationId)));
  event.parameters.push(new ethereum.EventParam('delegate', ethereum.Value.fromAddress(delegate)));
  event.block.number = blockNumber;
  event.block.timestamp = timestamp;
  return event;
}
