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

  constructor() {
    this.addAccount(AccountName.Glori, "Glori Investments");
    this.addAccount(AccountName.Joint, "Joint Investments");
    this.addAccount(AccountName.Daniel, "Daniel 529");
    this.addAccount(AccountName.Ale, "Ale 529");
    this.addAccount(AccountName.GloriIra, "Glori IRA Ameriprise");
    this.addAccount(AccountName.StrategicPortfolio, "Strategic Portfolio");
    this.addAccount(AccountName.GloriIraFunds, "Glori IRA Funds");
    this.addAccount(AccountName.GloriIraMixed, "Glori IRA Mixed");
    this.addAccount(AccountName.JorgeIraFunds, "Jorge IRA Funds");
    this.addAccount(AccountName.JorgeIraStocks, "Jorge IRA Stocks");
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
    if (this.quickenAccountMap.has(firstField)) return RowType.AccountHeader;

    switch (firstField) {
      case "Cash":
        return RowType.Cash;
      case "Name":
      case "":
      case "Totals in U.S. Dollar":
        return RowType.Other;
      default:
        return RowType.Item;
      // throw new Error("Unrecognied row type " + firstField);
    }
  };

  private determineActiveAccount = firstField =>
    this.accountsMap.get(this.quickenAccountMap.get(firstField));

  private buildPosition = (fields): Position => {
    return {
      name: fields[0],
      symbol: fields[2],
      shares: parseFloat(fields[3].replace(/,/g, '')),
      value: parseFloat(fields[4].replace(",", "")),
      raw: fields.join("\t")
    };
  };
}
