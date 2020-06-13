import * as fs from "fs";

export class Reporter {
  public writeReport = (results) => {
    let report = [
      "Account,Symbol A,Symbol Q,Shares A, Shares Q, Shares Diff,Value A, Value Q,Value Diff, Name A, Name Q",
    ];
    results.forEach((r) =>
      r.results.forEach((p) =>
        report.push(
          `${r.accountName},${p.master.symbol},${p.target.symbol},${p.master.shares},${p.target.shares},` +
            `${p.sharesDiff},${p.master.value},${p.target.value},${p.valueDiff},${p.master.name},${p.target.name}`
        )
      )
    );

    fs.writeFileSync("report.csv", report.join("\r\n"));
    console.log("\nResults writing to", "report.csv");
  };
}
