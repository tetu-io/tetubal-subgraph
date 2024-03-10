import { Address, BigInt } from '@graphprotocol/graph-ts';
import { UserBalanceHistoryEntity, UserEntity } from '../types/schema';

export function getOrCreateUser(address: Address): UserEntity {
  let user = UserEntity.load(address.toHexString());
  if (!user) {
    user = new UserEntity(address.toHexString());
    user.balance = BigInt.zero();
    user.save();
  }
  return user;
}

export function createUserBalanceHistory(user: UserEntity, blockNumber: BigInt, timestamp: BigInt, hash: string): void {
  const balanceHistory = new UserBalanceHistoryEntity(`${user.id}-${hash}`);
  balanceHistory.user = user.id;
  balanceHistory.balance = user.balance;
  balanceHistory.blockNumber = blockNumber;
  balanceHistory.blockTimestamp = timestamp;
  balanceHistory.hash = hash;
  balanceHistory.save();
}