import * as fs from "fs";
import { AccountName, Account, Position } from "./Account";
import * as csv from 'csv-string';

export class AmerpriseImporter {
  private ameripriseAccountMap = new Map<string, AccountName>();

  public accountsMap = new Map<AccountName, Account>();

  constructor() {
    this.addAccount(
      AccountName.Joint,
      "Joint (AMERIPRISE BROKERAGE)  0000 5191 5119 5 133"
    );
    this.addAccount(
        AccountName.Daniel,
        "Daniel 529 (AMERIPRISE BROKERAGE)  0000 1942 6511 2 133"
    );
    this.addAccount(
        AccountName.Ale,
        "Ale 529 (AMERIPRISE BROKERAGE)  0000 3178 6030 2 133"
    );
    this.addAccount(
        AccountName.GloriIraFunds,
        "Glori IRA Funds (SPS ADVISOR)  0000 4273 9761 7 133 Plan ID 0006 635 142"
    );
    this.addAccount(
        AccountName.GloriIraMixed,
        "Glori IRA Mixed (SPS ADVISOR)  0000 7135 6155 3 133 Plan ID 0006 635 142"
    );
    this.addAccount(
        AccountName.JorgeIraFunds,
        "Jorge IRA Funds (SPS ADVISOR)  0000 1994 4823 4 133 Plan ID 0006 635 065"
    );
    this.addAccount(
        AccountName.JorgeIraStocks,
        "Jorge IRA Stocks (SPS ADVISOR)  0000 2302 7868 1 133 Plan ID 0006 635 065"
    );
    this.addAccount(
        AccountName.StrategicPortfolio,
        "Strategic Portfolio (SPS ADVISOR)  0000 4606 3072 6 133"
    );
    this,this.addAccount(
        AccountName.Glori,
        "Glori (AMERIPRISE BROKERAGE)  0000 7215 5790 8 133"
    );

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
      console.log("Unkknown account", accountAlias);
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
