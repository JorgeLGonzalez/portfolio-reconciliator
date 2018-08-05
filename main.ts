import { QuickenPortfolioImporter } from "./src/QuickenPortfolioImporter";
import { AmerpriseImporter } from "./src/AmeripriseImporter";
import { Reconciler } from "./src/Reconciler";
import { Reporter } from "./src/Reporter";
import * as fs from 'fs';

console.log('Loading account names');
const accounts = JSON.parse(fs.readFileSync('./accounts.json', 'utf-8'));
console.log(`${accounts.length} account names.\n`);

console.log('Importing Quicken portfolio report from Fix.txt');
const quickenImporter = new QuickenPortfolioImporter(accounts);
quickenImporter.import('Fid.txt');
console.log('Positions', [...quickenImporter.accountsMap.values()].map(a => `${a.name}: ${a.positionsMap.size}`));

console.log('Importing Ameriprise portfolio from PortfolioHoldings.csv');
const ameripriseImpoerter = new AmerpriseImporter(accounts);
ameripriseImpoerter.import('PortfolioHoldings.csv');
console.log('Positions', [...ameripriseImpoerter.accountsMap.values()].map(a => `${a.name}: ${a.positionsMap.size}`));

console.log('\nReconciling');
const reconciler = new Reconciler();
const results = reconciler.reconcile(ameripriseImpoerter.accountsMap, quickenImporter.accountsMap);

console.log('\n\nReporting...');
console.log('Reconciliation errors');
results.forEach(r => r.results.filter(p => p.sharesDiff || Math.round(Math.abs(p.valueDiff)) > 1).forEach(p => {
    console.log(r.accountName, p.master.symbol || '?', p.target.symbol || '?', p.sharesDiff, p.valueDiff);
}));

const reporter = new Reporter();
reporter.writeReport(results);
