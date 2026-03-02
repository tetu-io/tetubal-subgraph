import { Transfer } from './types/TetuBalPower/ERC20Abi';
import { saveTetuBlockSnapshot } from './helpers/snapshot.helper';
import { handlePowerTransfer } from './helpers/voting-power.helper';

export function handleTransfer(event: Transfer): void {
  handlePowerTransfer(event.params.from, event.params.to, event.block.number, event.block.timestamp);
  saveTetuBlockSnapshot(event.block);
}
