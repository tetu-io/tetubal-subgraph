import { Transfer } from './types/TetuBal/ERC20Abi';
import { saveTetuBlockSnapshot } from './helpers/snapshot.helper';

export function handleTransfer(event: Transfer): void {
  saveTetuBlockSnapshot(event.block);
}