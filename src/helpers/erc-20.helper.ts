import { TokenEntity } from '../types/schema';
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { ERC20Abi } from '../types/ERC20/ERC20Abi';

export function getOrCreateToken(id: string): TokenEntity {
  let token = TokenEntity.load(id);
  const erc20 = ERC20Abi.bind(Address.fromString(id));
  if (token == null) {
    token = new TokenEntity(id);
    token.decimals = erc20.decimals();
    token.name = erc20.name();
    token.symbol = erc20.symbol();
  }
  token.totalSupply = erc20.totalSupply();
  token.save();
  return token;
}

export function balanceOf$(token: Address, address: Address): BigInt {
  const tryVal = ERC20Abi.bind(token).try_balanceOf(address);
  return tryVal.reverted ? BigInt.fromI32(0) : tryVal.value;
}

export function totalSupply$(token: Address): BigInt {
  const tryVal = ERC20Abi.bind(token).try_totalSupply();
  return tryVal.reverted ? BigInt.fromI32(0) : tryVal.value;
}