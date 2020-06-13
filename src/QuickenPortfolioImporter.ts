import * as fs from "fs";
import { Position, Account, IAccount, AccountName } from "./Account";

enum RowType {
  Item,
  AccountHeader,
  Cash,
  Other,
}

export class QuickenPortfolioImporter {
  private activeAccount: Account;
  private quickenAccountMap: Map<string, string>;

  public accountsMap = new Map<string, Account>();

  constructor(accounts: IAccount[]) {
    accounts.forEach((a) => this.addAccount(a.name, a.quicken));
    this.quickenAccountMap = [...this.accountsMap.entries()].reduce(
      (m, [_, account]) => m.set(account.alias, account.name),
      new Map<string, string>()
    );
  }

  private addAccount(name: string, alias: string) {
    const account = new Account(name, alias);
    this.accountsMap.set(name, account);

    return account;
  }

  public import(filename: string) {
    const file = fs.readFileSync(filename, "utf-8");
    file.split("\r\n").map((r) => this.parseRow(r));
  }

  private parseRow(row: string) {
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
  }

  private determineRowType(fields: string[]): RowType {
    if (fields.length !== 5) return RowType.Other;

    const firstField = fields[0];

    if (firstField === "Cash") return RowType.Cash;

    if (["Name", "", "Totals in U.S. Dollar"].indexOf(firstField) >= 0)
      return RowType.Other;

    if (this.quickenAccountMap.has(firstField)) return RowType.AccountHeader;

    this.manipulateJointIndex(fields);

    if (!fields[2] || !fields[3])
      throw new Error(
        `Unrecognized row type in Quicken file: ${fields.join("\t")}`
      );

    return RowType.Item;
  }

  /**
   * Need to make adjustments for Joint Index bonds as they lack
   * symbols in quicken and the share qty differs
   */
  private manipulateJointIndex(fields: string[]): void {
    const symbol = fields[2];
    if (symbol || this.activeAccount?.name !== AccountName.JointIndex) {
      return;
    }

    // qty in quicken shows as 100x less than in ameriprise
    fields[3] = String(parseInt(fields[3], 10) * 100);

    const name = fields[0];
    switch (name) {
      case "BARCLAYS BANK PLC AUTOCLLB NOTE LKD NDX INDU":
        fields[2] = "06747PAP4";
        break;
      case "CREDIT SUISSE CONTIN CPN YLD NOTE 7.5% LKD SPX NDX":
        fields[2] = "22551NLZ7";
        break;
      case "CREDIT SUISSE CONTIN CPN YLD NT 7% LKD SPX RTY":
        fields[2] = "22551NM60";
        break;
      case "GS FINANCE CORP CONTIN CPN INDX 6% LKD SX5E RTY":
        fields[2] = "40056YGK4";
        break;

      default:
        return;
    }
  }

  private determineActiveAccount(firstField: string) {
    if (!this.quickenAccountMap.has(firstField))
      throw new Error(`Unrecognized quicken account '${firstField}'`);

    const account = this.accountsMap.get(
      this.quickenAccountMap.get(firstField)
    );

    if (!account) throw new Error(`Quicken account '${firstField}' not found!`);

    return account;
  }

  private buildPosition(fields: string[]): Position {
    return {
      name: fields[0],
      symbol: fields[2],
      shares: parseFloat(fields[3].replace(/,/g, "")),
      value: parseFloat(fields[4].replace(",", "")),
      raw: fields.join("\t"),
    };
  }
}
