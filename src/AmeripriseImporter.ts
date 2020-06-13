import * as fs from "fs";
import {  Account, Position, IAccount } from "./Account";
import * as csv from "csv-string";

export class AmeripriseImporter {
  private ameripriseAccountMap = new Map<string, string>();

  public accountsMap = new Map<string, Account>();

  constructor(accounts: IAccount[]) {
    accounts.forEach((a) => this.addAccount(a.name, a.ameriprise));

    this.ameripriseAccountMap = [...this.accountsMap.entries()].reduce(
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
    file.split("\r\n").forEach((r) => this.parseRow(r));
  }

  private parseRow(row: string): void {
    const fields = csv
      .parse(row)[0]
      .map((f: string) => f.replace(/[",\$"]/g, "").trim());

    if (
      fields.length < 7 ||
      fields[0] === "Symbol" ||
      fields[0].startsWith("Total ")
    ) {
      return;
    }

    const accountAlias = fields[2].replace(/"/g, "").trim();
    const account = this.accountsMap.get(
      this.ameripriseAccountMap.get(accountAlias)
    );

    if (accountAlias === "TERM LIFE INS" || fields[0] === "FIX") {
      return;
    }

    if (account) {
      const position = this.buildPosition(fields);
      account.addPosition(position);
    } else {
      throw new Error(`Unrecognized Ameriprise account '${accountAlias}'`);
    }
  }

  private buildPosition(fields): Position {
    return {
      name: fields[1],
      symbol: fields[0],
      shares: parseFloat(fields[4]),
      value: parseFloat(fields[6].replace(",", "")),
      raw: fields.join("\t"),
    };
  }
}
