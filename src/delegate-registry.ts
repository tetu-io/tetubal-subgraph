import { Address, BigInt } from '@graphprotocol/graph-ts';
import { DelegationEntity } from './types/schema';
import { ClearDelegate, ClearDelegate1, SetDelegate } from './types/DelegateRegistry/DelegateRegistry';
import { TETUBAL_DELEGATION_ID } from './helpers/constant';
import { saveTetuBlockSnapshot } from './helpers/snapshot.helper';
import { applyDelegation, refreshVotingPowerFor } from './helpers/voting-power.helper';

const ZERO_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000');

function shouldHandleDelegationId(delegationId: string): bool {
  return delegationId == TETUBAL_DELEGATION_ID;
}

function persistDelegation(
  delegator: Address,
  delegationId: string,
  delegate: string | null,
  blockNumber: BigInt,
  timestamp: BigInt,
): void {
  const id = delegator.toHexString();
  let entity = DelegationEntity.load(id);
  if (!entity) {
    entity = new DelegationEntity(id);
    entity.delegator = id;
  }
  entity.delegate = delegate;
  entity.delegationId = delegationId;
  entity.updatedAtBlock = blockNumber;
  entity.updatedAtTs = timestamp;
  entity.save();
}

export function handleSetDelegate(event: SetDelegate): void {
  const delegationId = event.params.id.toHexString();
  if (!shouldHandleDelegationId(delegationId)) {
    return;
  }

  refreshVotingPowerFor(event.params.delegator, event.block.number, event.block.timestamp);
  applyDelegation(event.params.delegator, event.params.delegate, event.block.number, event.block.timestamp);
  persistDelegation(
    event.params.delegator,
    delegationId,
    event.params.delegate.toHexString(),
    event.block.number,
    event.block.timestamp,
  );
  saveTetuBlockSnapshot(event.block);
}

export function handleClearDelegate(event: ClearDelegate): void {
  const delegationId = event.params.id.toHexString();
  if (!shouldHandleDelegationId(delegationId)) {
    return;
  }

  refreshVotingPowerFor(event.params.delegator, event.block.number, event.block.timestamp);
  applyDelegation(event.params.delegator, ZERO_ADDRESS, event.block.number, event.block.timestamp);
  persistDelegation(event.params.delegator, delegationId, null, event.block.number, event.block.timestamp);
  saveTetuBlockSnapshot(event.block);
}

export function handleClearDelegateWithDelegate(event: ClearDelegate1): void {
  const delegationId = event.params.id.toHexString();
  if (!shouldHandleDelegationId(delegationId)) {
    return;
  }

  refreshVotingPowerFor(event.params.delegator, event.block.number, event.block.timestamp);
  applyDelegation(event.params.delegator, ZERO_ADDRESS, event.block.number, event.block.timestamp);
  persistDelegation(event.params.delegator, delegationId, null, event.block.number, event.block.timestamp);
  saveTetuBlockSnapshot(event.block);
}
