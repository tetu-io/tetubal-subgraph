import { newMockEvent, createMockedFunction } from 'matchstick-as';
import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { ClearDelegate, ClearDelegate1, SetDelegate } from '../src/types/DelegateRegistry/DelegateRegistry';
import { Transfer } from '../src/types/TetuBalPower/ERC20Abi';
import { BALANCER_VAULT, BRIBER, TETU_BAL, TETU_BAL_POWER } from '../src/helpers/constant';

export function mockPowerBalance(account: Address, balance: BigInt): void {
  createMockedFunction(TETU_BAL_POWER, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(account)])
    .returns([ethereum.Value.fromUnsignedBigInt(balance)]);
}

export function mockSnapshotCalls(): void {
  createMockedFunction(TETU_BAL, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(BALANCER_VAULT)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.zero())]);
  createMockedFunction(TETU_BAL, 'totalSupply', 'totalSupply():(uint256)')
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))]);
  mockPowerBalance(BRIBER, BigInt.zero());
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
