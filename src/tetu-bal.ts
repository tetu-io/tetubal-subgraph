import { balanceOf$, totalSupply$ } from './helpers/erc-20.helper';
import { BALANCER_VAULT, BRIBER, TETU_BAL, TETU_BAL_POWER } from './helpers/constant';
import { BigDecimal } from '@graphprotocol/graph-ts';
import { TetuBlockSnapshot } from './types/schema';
import { Transfer } from './types/ERC20/ERC20Abi';

export function handleTransfer(event: Transfer): void {
  const block = event.block;
  const xTetuBal = balanceOf$(TETU_BAL, BALANCER_VAULT).toBigDecimal();
  const xTetuBalPower = balanceOf$(TETU_BAL_POWER, BRIBER).toBigDecimal();
  const totalSupply = totalSupply$(TETU_BAL).toBigDecimal();
  const tetuBalPercent = xTetuBal.div(totalSupply).times(BigDecimal.fromString('100'));
  const tetuBalPowerPercent = xTetuBalPower.div(totalSupply).times(BigDecimal.fromString('100'));

  const snapshot = new TetuBlockSnapshot(block.number.toString());
  snapshot.block = block.number;
  snapshot.timestamp = block.timestamp;
  snapshot.totalSupply = totalSupply;
  snapshot.xTetuBal = xTetuBal;
  snapshot.xTetuBalPower = xTetuBalPower;
  snapshot.tetuBalPercent = tetuBalPercent;
  snapshot.tetuBalPowerPercent = tetuBalPowerPercent;
  snapshot.save();

}