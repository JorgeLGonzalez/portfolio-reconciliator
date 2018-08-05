import * as fs from "fs";
import { Position, Account, AccountName } from "./Account";

enum RowType {
  Item,
  AccountHeader,
  Cash,
  Other
}

export class QuickenPortfolioImporter {
  private activeAccount: Account;
  private quickenAccountMap: Map<string, AccountName>;

  public accountsMap = new Map<AccountName, Account>();

  constructor(accounts) {
    accounts.forEach(a => this.addAccount(a.name, a.quicken));
    this.quickenAccountMap = [...this.accountsMap.entries()].reduce(
      (m, [_, account]) => m.set(account.alias, account.name),
      new Map<string, AccountName>()
    );
  }

  private addAccount = (name: AccountName, alias: string) => {
    const account = new Account(name, alias);
    this.accountsMap.set(name, account);

    return account;
  };

  public import = filename => {
    const file = fs.readFileSync(filename, "utf-8");
    file.split("\r\n").map(this.parseRow);
  };

  private parseRow = row => {
    const fields = row.split("\t");
    const rowType = this.determineRowType(fields);

    if (rowType === RowType.AccountHeader) {
      this.activeAccount = this.determineActiveAccount(fields[0]);
      console.log("Processing Quicken account", this.activeAccount.name);
    } else if (rowType === RowType.Item) {
      const position = this.buildPosition(fields);
      if (!this.activeAccount)
        throw new Error(
          "Cannot add a position without an active account " + position.name
        );
      this.activeAccount.addPosition(position);
    }
  };

  private determineRowType = (fields): RowType => {
    if (fields.length !== 5) return RowType.Other;

    const firstField = fields[0];

    if (firstField === "Cash") return RowType.Cash;

    if (["Name", "", "Totals in U.S. Dollar"].indexOf(firstField) >= 0)
      return RowType.Other;

    if (this.quickenAccountMap.has(firstField)) return RowType.AccountHeader;

    if (!fields[2] || !fields[3])
      throw new Error(
        `Unrecognized row type in Quicken file: ${fields.join("\t")}`
      );

      return RowType.Item;
  };

  private determineActiveAccount = firstField => {
    if (!this.quickenAccountMap.has(firstField))
      throw new Error(`Unrecognized quicken account '${firstField}'`);

    const account = this.accountsMap.get(
      this.quickenAccountMap.get(firstField)
    );

    if (!account) throw new Error(`Quicken account '${firstField}' not found!`);

    return account;
  };

  private buildPosition = (fields): Position => {
    return {
      name: fields[0],
      symbol: fields[2],
      shares: parseFloat(fields[3].replace(/,/g, "")),
      value: parseFloat(fields[4].replace(",", "")),
      raw: fields.join("\t")
    };
  };
}
