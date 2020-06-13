export enum AccountName {
  JointIndex = 'Joint Index',
 
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
    public readonly name: string,
    public readonly alias: string
  ) {}

  public addPosition = (position: Position) =>
    this.positionsMap.set(position.symbol, position);
}

export interface IAccount {
  name: string;
  quicken: string;
  ameriprise: string;
}