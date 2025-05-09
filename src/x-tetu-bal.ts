import { TetuBlockSnapshot, TransferHistoryEntity } from './types/schema';
import { createUserBalanceHistory, getOrCreateUser } from './helpers/user-helper';
import { balanceOf$, getOrCreateToken, totalSupply$ } from './helpers/erc-20.helper';
import { Transfer } from './generated/ERC20Abi';

export function handleTransfer(event: Transfer): void {
  const from = event.params.from;
  const to = event.params.to;
  const value = event.params.value;
  const hash = event.transaction.hash.toHex();
  const blockNumber = event.block.number;
  const timestamp = event.block.timestamp;


  const transfer = new TransferHistoryEntity(hash);
  transfer.from = from.toHexString();
  transfer.to = to.toHexString();
  transfer.value = value;
  transfer.blockNumber = blockNumber;
  transfer.blockTimestamp = timestamp;
  transfer.save();

  const fromUser = getOrCreateUser(from);
  fromUser.balance = fromUser.balance.minus(value);
  fromUser.save();
  createUserBalanceHistory(fromUser, blockNumber, timestamp, hash);

  const toUser = getOrCreateUser(to);
  toUser.balance = toUser.balance.plus(value);
  toUser.save();
  createUserBalanceHistory(toUser, blockNumber, timestamp, hash);
  getOrCreateToken(event.address.toHexString());
}