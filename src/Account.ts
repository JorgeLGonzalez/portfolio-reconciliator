export enum AccountName {
  Glori = "Glori Ameriprise",
  GloriIra = "Glori IRA Ameriprise",
  StrategicPortfolio = "Strategic Portfolio",
  GloriIraFunds = "Glori IRA Funds",
  GloriIraMixed = "Glori IRA Mixed",
  JorgeIraFunds = "Jorge IRA Funds",
  JorgeIraStocks = "Jorge IRA Stocks",
  Joint = "Joint",
  Daniel = "Daniel 529",
  Ale = "Ale 529",

  None = 'None'
}

export class Position {
  name: string;
  symbol: string;
  shares: number = 0;
  value: number = 0;
  raw: string;
}

export class Account {
  private _positionsMap = new Map<string, Position>();

  public get positionsMap() {
    return this._positionsMap;
  }

  constructor(
    public readonly name: AccountName,
    public readonly alias: string
  ) {}

  public addPosition = (position: Position) =>
    this.positionsMap.set(position.symbol, position);
}
