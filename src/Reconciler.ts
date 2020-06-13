import { Account, Position } from "./Account";

export class Reconciler {
  public reconcile = (
    ameriprise: Map<string, Account>,
    quicken: Map<string, Account>
  ) => {
    return [...ameriprise.values()]
      .map(a => ({
        accountName: a.name,
        results: this.reconcileAccount(a, quicken.get(a.name))
      }))
      .concat(
        [...quicken.values()].filter(a => !ameriprise.get(a.name)).map(a => ({
          accountName: a.name,
          results: this.reconcileAccount(null, a)
        }))
      );
  };

  private reconcileAccount = (account1: Account, account2: Account) => {
    account1 = account1 || new Account('None', 'None');
    account2 = account2 || new Account('None', 'None');

    return [...account1.positionsMap.values()]
      .map(master =>
        this.reconcilePosition(master, account2.positionsMap.get(master.symbol))
      )
      .concat(
        [...account2.positionsMap.values()]
          .filter(p => !account1.positionsMap.has(p.symbol))
          .map(p => this.reconcilePosition(null, p))
      );
  };

  private reconcilePosition = (master: Position, target: Position) => {
    master = master || new Position();
    target = target || new Position();

    return {
      master,
      target,
      sharesDiff: master.shares - target.shares,
      valueDiff: Math.round(master.value - target.value)
    };
  };
}
