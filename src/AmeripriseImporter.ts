import * as fs from "fs";
import { AccountName, Account, Position } from "./Account";
import * as csv from 'csv-string';

export class AmerpriseImporter {
  private ameripriseAccountMap = new Map<string, AccountName>();

  public accountsMap = new Map<AccountName, Account>();

  constructor(accounts) {
    accounts.forEach(a => this.addAccount(a.name, a.ameriprise));

    this.ameripriseAccountMap = [...this.accountsMap.entries()].reduce(
      (m, [_, account]) => m.set(account.alias, account.name),
      new Map<string, AccountName>()
    );
  }

  private addAccount = (name: AccountName, alias: string) => {
    const account = new Account(name, alias);
    this.accountsMap.set(name, account);

    return account;
  };

  import = filename => {
    const file = fs.readFileSync(filename, "utf-8");
    file
      .split("\r\n")
      .filter(r => {
         return  r.startsWith(`"Equities"`) || r.startsWith(`"Mutual Funds"`)
        })
      .map(this.parseRow);
  };

  private parseRow = row => {
    const fields = csv.parse(row)[0].map(f => f.replace(/[",\$"]/g, '').trim());
    const accountAlias = fields[3].replace(/"/g, '').trim();
    const account = this.accountsMap.get(
      this.ameripriseAccountMap.get(accountAlias)
    );

    if (account) {
      const position = this.buildPosition(fields);
      account.addPosition(position);
    } else {
      throw new Error(`Unrecognized Ameriprise account '${accountAlias}'`);
    }
  };

  private buildPosition = (fields): Position => {
    return {
      name: fields[2],
      symbol: fields[1],
      shares: parseFloat(fields[4]),
      value: parseFloat(fields[6].replace(",", "")),
      raw: fields.join("\t")
    };
  };
}
