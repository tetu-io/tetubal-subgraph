import { assert, clearStore, describe, test } from 'matchstick-as/assembly/index';
import { createMockedFunction } from 'matchstick-as';
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { handleTransfer as handleTetuBalTransfer } from '../src/tetu-bal';
import { handleTransfer as handleXTetuBalTransfer } from '../src/x-tetu-bal';
import { getOrCreateToken } from '../src/helpers/erc-20.helper';
import { createUserBalanceHistory, getOrCreateUser } from '../src/helpers/user-helper';
import { createTetuBalTransferEvent, createXTetuBalTransferEvent, mockSnapshotWith } from './erc-20-utils';

const ZERO = Address.fromString('0x0000000000000000000000000000000000000000');
const USER_A = Address.fromString('0x00000000000000000000000000000000000000a1');
const USER_B = Address.fromString('0x00000000000000000000000000000000000000b2');
const USER_C = Address.fromString('0x00000000000000000000000000000000000000c3');
const TEST_TOKEN = Address.fromString('0x0000000000000000000000000000000000000f01');

function mockTokenMeta(token: Address, totalSupply: BigInt): void {
  createMockedFunction(token, 'decimals', 'decimals():(uint8)').returns([ethereum.Value.fromI32(18)]);
  createMockedFunction(token, 'name', 'name():(string)').returns([ethereum.Value.fromString('Test Token')]);
  createMockedFunction(token, 'symbol', 'symbol():(string)').returns([ethereum.Value.fromString('TEST')]);
  createMockedFunction(token, 'totalSupply', 'totalSupply():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(totalSupply),
  ]);
}

describe('other handlers and helpers coverage', () => {
  test('tetu-bal transfer stores snapshot with percents', () => {
    clearStore();
    mockSnapshotWith(BigInt.fromI32(25), BigInt.fromI32(10), BigInt.fromI32(100));

    handleTetuBalTransfer(createTetuBalTransferEvent(ZERO, USER_A, BigInt.fromI32(1), BigInt.fromI32(11), BigInt.fromI32(22)));

    assert.fieldEquals('TetuBlockSnapshot', '11', 'xTetuBal', '25');
    assert.fieldEquals('TetuBlockSnapshot', '11', 'xTetuBalPower', '10');
    assert.fieldEquals('TetuBlockSnapshot', '11', 'totalSupply', '100');
    assert.fieldEquals('TetuBlockSnapshot', '11', 'tetuBalPercent', '25');
    assert.fieldEquals('TetuBlockSnapshot', '11', 'tetuBalPowerPercent', '10');
  });

  test('tetu-bal snapshot percents are zero when total supply is zero', () => {
    clearStore();
    mockSnapshotWith(BigInt.fromI32(7), BigInt.fromI32(3), BigInt.zero());

    handleTetuBalTransfer(createTetuBalTransferEvent(ZERO, USER_A, BigInt.fromI32(1), BigInt.fromI32(12), BigInt.fromI32(23)));

    assert.fieldEquals('TetuBlockSnapshot', '12', 'totalSupply', '0');
    assert.fieldEquals('TetuBlockSnapshot', '12', 'tetuBalPercent', '0');
    assert.fieldEquals('TetuBlockSnapshot', '12', 'tetuBalPowerPercent', '0');
  });

  test('x-tetu-bal transfer updates balances, history and token', () => {
    clearStore();
    mockTokenMeta(TEST_TOKEN, BigInt.fromI32(1000));

    const seededUser = getOrCreateUser(USER_A);
    seededUser.balance = BigInt.fromI32(20);
    seededUser.save();

    handleXTetuBalTransfer(
      createXTetuBalTransferEvent(
        USER_A,
        USER_B,
        BigInt.fromI32(15),
        BigInt.fromI32(20),
        BigInt.fromI32(30),
        '0x0000000000000000000000000000000000000000000000000000000000000abc',
        TEST_TOKEN,
      ),
    );

    assert.fieldEquals(
      'TransferHistoryEntity',
      '0x0000000000000000000000000000000000000000000000000000000000000abc',
      'from',
      USER_A.toHexString(),
    );
    assert.fieldEquals(
      'TransferHistoryEntity',
      '0x0000000000000000000000000000000000000000000000000000000000000abc',
      'to',
      USER_B.toHexString(),
    );
    assert.fieldEquals(
      'TransferHistoryEntity',
      '0x0000000000000000000000000000000000000000000000000000000000000abc',
      'value',
      '15',
    );
    assert.fieldEquals('UserEntity', USER_A.toHexString(), 'balance', '5');
    assert.fieldEquals('UserEntity', USER_B.toHexString(), 'balance', '15');
    assert.entityCount('UserBalanceHistoryEntity', 2);
    assert.fieldEquals('TokenEntity', TEST_TOKEN.toHexString(), 'name', 'Test Token');
    assert.fieldEquals('TokenEntity', TEST_TOKEN.toHexString(), 'symbol', 'TEST');
    assert.fieldEquals('TokenEntity', TEST_TOKEN.toHexString(), 'decimals', '18');
    assert.fieldEquals('TokenEntity', TEST_TOKEN.toHexString(), 'totalSupply', '1000');
  });

  test('getOrCreateToken refreshes total supply for existing token', () => {
    clearStore();
    mockTokenMeta(TEST_TOKEN, BigInt.fromI32(1000));
    getOrCreateToken(TEST_TOKEN.toHexString());
    assert.fieldEquals('TokenEntity', TEST_TOKEN.toHexString(), 'totalSupply', '1000');

    mockTokenMeta(TEST_TOKEN, BigInt.fromI32(1200));
    getOrCreateToken(TEST_TOKEN.toHexString());
    assert.fieldEquals('TokenEntity', TEST_TOKEN.toHexString(), 'totalSupply', '1200');
    assert.fieldEquals('TokenEntity', TEST_TOKEN.toHexString(), 'name', 'Test Token');
  });

  test('user helper initializes user and writes balance history', () => {
    clearStore();
    const user = getOrCreateUser(USER_C);
    assert.fieldEquals('UserEntity', USER_C.toHexString(), 'balance', '0');

    user.balance = BigInt.fromI32(42);
    user.save();
    createUserBalanceHistory(user, BigInt.fromI32(30), BigInt.fromI32(40), '0xhash1');

    assert.fieldEquals('UserBalanceHistoryEntity', `${USER_C.toHexString()}-0xhash1`, 'user', USER_C.toHexString());
    assert.fieldEquals('UserBalanceHistoryEntity', `${USER_C.toHexString()}-0xhash1`, 'balance', '42');
    assert.fieldEquals('UserBalanceHistoryEntity', `${USER_C.toHexString()}-0xhash1`, 'blockNumber', '30');
    assert.fieldEquals('UserBalanceHistoryEntity', `${USER_C.toHexString()}-0xhash1`, 'blockTimestamp', '40');
  });
});
