import { Address, BigInt } from '@graphprotocol/graph-ts';
import { UserVotingPowerEntity } from '../types/schema';
import { TETU_BAL_POWER } from './constant';
import { balanceOf$ } from './erc-20.helper';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function isZeroAddress(account: Address): bool {
  return account.toHexString() == ZERO_ADDRESS;
}

function getOrCreateUserVotingPower(accountId: string): UserVotingPowerEntity {
  let entity = UserVotingPowerEntity.load(accountId);
  if (!entity) {
    entity = new UserVotingPowerEntity(accountId);
    entity.ownBalance = BigInt.zero();
    entity.delegatedInBalance = BigInt.zero();
    entity.delegatedOutTo = null;
    entity.effectiveVotingPower = BigInt.zero();
    entity.updatedAtBlock = BigInt.zero();
    entity.updatedAtTs = BigInt.zero();
  }
  return entity;
}

function recomputeEffectiveVotingPower(entity: UserVotingPowerEntity): void {
  if (entity.delegatedOutTo) {
    entity.effectiveVotingPower = entity.delegatedInBalance;
    return;
  }
  entity.effectiveVotingPower = entity.ownBalance.plus(entity.delegatedInBalance);
}

function touchAndSave(entity: UserVotingPowerEntity, blockNumber: BigInt, timestamp: BigInt): void {
  entity.updatedAtBlock = blockNumber;
  entity.updatedAtTs = timestamp;
  entity.save();
}

export function refreshVotingPowerFor(account: Address, blockNumber: BigInt, timestamp: BigInt): void {
  if (isZeroAddress(account)) {
    return;
  }

  const accountId = account.toHexString();
  const entity = getOrCreateUserVotingPower(accountId);
  const previousBalance = entity.ownBalance;
  const nextBalance = balanceOf$(TETU_BAL_POWER, account);
  const delta = nextBalance.minus(previousBalance);

  entity.ownBalance = nextBalance;
  recomputeEffectiveVotingPower(entity);
  touchAndSave(entity, blockNumber, timestamp);

  const delegateId = entity.delegatedOutTo;
  if (delegateId && !delta.isZero()) {
    const delegateEntity = getOrCreateUserVotingPower(delegateId);
    delegateEntity.delegatedInBalance = delegateEntity.delegatedInBalance.plus(delta);
    recomputeEffectiveVotingPower(delegateEntity);
    touchAndSave(delegateEntity, blockNumber, timestamp);
  }
}

export function applyDelegation(
  delegator: Address,
  newDelegate: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
): void {
  if (isZeroAddress(delegator)) {
    return;
  }

  const delegatorId = delegator.toHexString();
  const delegatorEntity = getOrCreateUserVotingPower(delegatorId);
  const ownBalance = delegatorEntity.ownBalance;
  const previousDelegateId = delegatorEntity.delegatedOutTo;
  const isDelegating = !isZeroAddress(newDelegate);
  const nextDelegateId = isDelegating ? newDelegate.toHexString() : '';
  const wasDelegating = previousDelegateId != null;

  if ((wasDelegating && isDelegating && previousDelegateId == nextDelegateId) || (!wasDelegating && !isDelegating)) {
    touchAndSave(delegatorEntity, blockNumber, timestamp);
    return;
  }

  if (previousDelegateId) {
    const previousDelegate = getOrCreateUserVotingPower(previousDelegateId);
    previousDelegate.delegatedInBalance = previousDelegate.delegatedInBalance.minus(ownBalance);
    recomputeEffectiveVotingPower(previousDelegate);
    touchAndSave(previousDelegate, blockNumber, timestamp);
  }

  delegatorEntity.delegatedOutTo = isDelegating ? nextDelegateId : null;
  recomputeEffectiveVotingPower(delegatorEntity);
  touchAndSave(delegatorEntity, blockNumber, timestamp);

  if (isDelegating) {
    const nextDelegate = getOrCreateUserVotingPower(nextDelegateId);
    nextDelegate.delegatedInBalance = nextDelegate.delegatedInBalance.plus(ownBalance);
    recomputeEffectiveVotingPower(nextDelegate);
    touchAndSave(nextDelegate, blockNumber, timestamp);
  }
}

export function handlePowerTransfer(from: Address, to: Address, blockNumber: BigInt, timestamp: BigInt): void {
  refreshVotingPowerFor(from, blockNumber, timestamp);
  refreshVotingPowerFor(to, blockNumber, timestamp);
}

export function getEffectiveVotingPower(account: Address): BigInt {
  const entity = UserVotingPowerEntity.load(account.toHexString());
  if (!entity) {
    return balanceOf$(TETU_BAL_POWER, account);
  }
  return entity.effectiveVotingPower;
}
