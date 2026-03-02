import { BigDecimal, ethereum } from '@graphprotocol/graph-ts';
import { TetuBlockSnapshot } from '../types/schema';
import { BALANCER_VAULT, BRIBER, TETU_BAL } from './constant';
import { balanceOf$, totalSupply$ } from './erc-20.helper';
import { getEffectiveVotingPower } from './voting-power.helper';

export function saveTetuBlockSnapshot(block: ethereum.Block): void {
  const xTetuBal = balanceOf$(TETU_BAL, BALANCER_VAULT).toBigDecimal();
  const xTetuBalPower = getEffectiveVotingPower(BRIBER).toBigDecimal();
  const totalSupply = totalSupply$(TETU_BAL).toBigDecimal();

  const tetuBalPercent = totalSupply.equals(BigDecimal.zero())
    ? BigDecimal.zero()
    : xTetuBal.div(totalSupply).times(BigDecimal.fromString('100'));
  const tetuBalPowerPercent = totalSupply.equals(BigDecimal.zero())
    ? BigDecimal.zero()
    : xTetuBalPower.div(totalSupply).times(BigDecimal.fromString('100'));

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
