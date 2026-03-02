import { assert, clearStore, describe, test } from 'matchstick-as/assembly/index';
import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { TETUBAL_DELEGATION_ID } from '../src/helpers/constant';
import { handleTransfer } from '../src/tetu-bal-power';
import { handleClearDelegate, handleClearDelegateWithDelegate, handleSetDelegate } from '../src/delegate-registry';
import {
  createClearDelegateEvent,
  createClearDelegateWithDelegateEvent,
  createPowerTransferEvent,
  createSetDelegateEvent,
  mockPowerBalance,
  mockSnapshotCalls,
} from './erc-20-utils';

const ZERO = Address.fromString('0x0000000000000000000000000000000000000000');
const USER_A = Address.fromString('0x00000000000000000000000000000000000000a1');
const USER_B = Address.fromString('0x00000000000000000000000000000000000000b2');
const USER_C = Address.fromString('0x00000000000000000000000000000000000000c3');
const USER_D = Address.fromString('0x00000000000000000000000000000000000000d4');
const VALID_ID = Bytes.fromHexString(TETUBAL_DELEGATION_ID);
const OTHER_ID = Bytes.fromHexString('0x1111111111111111111111111111111111111111111111111111111111111111');

function seedBalances(a: i32, b: i32, c: i32, d: i32): void {
  mockSnapshotCalls();
  mockPowerBalance(USER_A, BigInt.fromI32(a));
  mockPowerBalance(USER_B, BigInt.fromI32(b));
  mockPowerBalance(USER_C, BigInt.fromI32(c));
  mockPowerBalance(USER_D, BigInt.fromI32(d));
}

describe('tetuBAL voting power with delegation', () => {
  test('no delegation: effective power equals own balance', () => {
    clearStore();
    seedBalances(100, 0, 0, 0);

    handleTransfer(createPowerTransferEvent(ZERO, USER_A, BigInt.fromI32(100), BigInt.fromI32(1), BigInt.fromI32(1)));

    assert.fieldEquals('UserVotingPowerEntity', USER_A.toHexString(), 'ownBalance', '100');
    assert.fieldEquals('UserVotingPowerEntity', USER_A.toHexString(), 'delegatedInBalance', '0');
    assert.fieldEquals('UserVotingPowerEntity', USER_A.toHexString(), 'effectiveVotingPower', '100');
  });

  test('set delegate moves delegator weight to delegate', () => {
    clearStore();
    seedBalances(100, 50, 0, 0);

    handleTransfer(createPowerTransferEvent(ZERO, USER_A, BigInt.fromI32(100), BigInt.fromI32(1), BigInt.fromI32(1)));
    handleTransfer(createPowerTransferEvent(ZERO, USER_B, BigInt.fromI32(50), BigInt.fromI32(2), BigInt.fromI32(2)));
    handleSetDelegate(createSetDelegateEvent(USER_A, VALID_ID, USER_B, BigInt.fromI32(3), BigInt.fromI32(3)));

    assert.fieldEquals('UserVotingPowerEntity', USER_A.toHexString(), 'effectiveVotingPower', '0');
    assert.fieldEquals('UserVotingPowerEntity', USER_B.toHexString(), 'delegatedInBalance', '100');
    assert.fieldEquals('UserVotingPowerEntity', USER_B.toHexString(), 'effectiveVotingPower', '150');
    assert.fieldEquals('DelegationEntity', USER_A.toHexString(), 'delegate', USER_B.toHexString());
  });

  test('redelegate moves inbound power from old to new delegate', () => {
    clearStore();
    seedBalances(100, 50, 20, 0);

    handleTransfer(createPowerTransferEvent(ZERO, USER_A, BigInt.fromI32(100), BigInt.fromI32(1), BigInt.fromI32(1)));
    handleTransfer(createPowerTransferEvent(ZERO, USER_B, BigInt.fromI32(50), BigInt.fromI32(2), BigInt.fromI32(2)));
    handleTransfer(createPowerTransferEvent(ZERO, USER_C, BigInt.fromI32(20), BigInt.fromI32(3), BigInt.fromI32(3)));
    handleSetDelegate(createSetDelegateEvent(USER_A, VALID_ID, USER_B, BigInt.fromI32(4), BigInt.fromI32(4)));
    handleSetDelegate(createSetDelegateEvent(USER_A, VALID_ID, USER_C, BigInt.fromI32(5), BigInt.fromI32(5)));

    assert.fieldEquals('UserVotingPowerEntity', USER_B.toHexString(), 'delegatedInBalance', '0');
    assert.fieldEquals('UserVotingPowerEntity', USER_B.toHexString(), 'effectiveVotingPower', '50');
    assert.fieldEquals('UserVotingPowerEntity', USER_C.toHexString(), 'delegatedInBalance', '100');
    assert.fieldEquals('UserVotingPowerEntity', USER_C.toHexString(), 'effectiveVotingPower', '120');
  });

  test('clear delegate returns weight to delegator', () => {
    clearStore();
    seedBalances(100, 50, 20, 0);

    handleTransfer(createPowerTransferEvent(ZERO, USER_A, BigInt.fromI32(100), BigInt.fromI32(1), BigInt.fromI32(1)));
    handleTransfer(createPowerTransferEvent(ZERO, USER_C, BigInt.fromI32(20), BigInt.fromI32(2), BigInt.fromI32(2)));
    handleSetDelegate(createSetDelegateEvent(USER_A, VALID_ID, USER_C, BigInt.fromI32(3), BigInt.fromI32(3)));
    handleClearDelegate(createClearDelegateEvent(USER_A, VALID_ID, BigInt.fromI32(4), BigInt.fromI32(4)));

    assert.fieldEquals('UserVotingPowerEntity', USER_A.toHexString(), 'effectiveVotingPower', '100');
    assert.fieldEquals('UserVotingPowerEntity', USER_C.toHexString(), 'delegatedInBalance', '0');
    assert.fieldEquals('UserVotingPowerEntity', USER_C.toHexString(), 'effectiveVotingPower', '20');
  });

  test('transfer while delegated updates delegate and receiver power', () => {
    clearStore();
    seedBalances(100, 50, 0, 0);

    handleTransfer(createPowerTransferEvent(ZERO, USER_A, BigInt.fromI32(100), BigInt.fromI32(1), BigInt.fromI32(1)));
    handleTransfer(createPowerTransferEvent(ZERO, USER_B, BigInt.fromI32(50), BigInt.fromI32(2), BigInt.fromI32(2)));
    handleSetDelegate(createSetDelegateEvent(USER_A, VALID_ID, USER_B, BigInt.fromI32(3), BigInt.fromI32(3)));

    seedBalances(70, 50, 0, 30);
    handleTransfer(createPowerTransferEvent(USER_A, USER_D, BigInt.fromI32(30), BigInt.fromI32(4), BigInt.fromI32(4)));

    assert.fieldEquals('UserVotingPowerEntity', USER_A.toHexString(), 'ownBalance', '70');
    assert.fieldEquals('UserVotingPowerEntity', USER_A.toHexString(), 'effectiveVotingPower', '0');
    assert.fieldEquals('UserVotingPowerEntity', USER_B.toHexString(), 'delegatedInBalance', '70');
    assert.fieldEquals('UserVotingPowerEntity', USER_B.toHexString(), 'effectiveVotingPower', '120');
    assert.fieldEquals('UserVotingPowerEntity', USER_D.toHexString(), 'effectiveVotingPower', '30');
  });

  test('ignore delegation events for other delegation id', () => {
    clearStore();
    seedBalances(100, 50, 0, 0);

    handleTransfer(createPowerTransferEvent(ZERO, USER_A, BigInt.fromI32(100), BigInt.fromI32(1), BigInt.fromI32(1)));
    handleTransfer(createPowerTransferEvent(ZERO, USER_B, BigInt.fromI32(50), BigInt.fromI32(2), BigInt.fromI32(2)));
    handleSetDelegate(createSetDelegateEvent(USER_A, OTHER_ID, USER_B, BigInt.fromI32(3), BigInt.fromI32(3)));

    assert.entityCount('DelegationEntity', 0);
    assert.fieldEquals('UserVotingPowerEntity', USER_A.toHexString(), 'effectiveVotingPower', '100');
    assert.fieldEquals('UserVotingPowerEntity', USER_B.toHexString(), 'effectiveVotingPower', '50');
  });

  test('clear delegate with delegate parameter is supported', () => {
    clearStore();
    seedBalances(100, 50, 0, 0);

    handleTransfer(createPowerTransferEvent(ZERO, USER_A, BigInt.fromI32(100), BigInt.fromI32(1), BigInt.fromI32(1)));
    handleTransfer(createPowerTransferEvent(ZERO, USER_B, BigInt.fromI32(50), BigInt.fromI32(2), BigInt.fromI32(2)));
    handleSetDelegate(createSetDelegateEvent(USER_A, VALID_ID, USER_B, BigInt.fromI32(3), BigInt.fromI32(3)));
    handleClearDelegateWithDelegate(
      createClearDelegateWithDelegateEvent(USER_A, VALID_ID, USER_B, BigInt.fromI32(4), BigInt.fromI32(4)),
    );

    assert.fieldEquals('UserVotingPowerEntity', USER_A.toHexString(), 'effectiveVotingPower', '100');
    assert.fieldEquals('UserVotingPowerEntity', USER_B.toHexString(), 'delegatedInBalance', '0');
  });
});
