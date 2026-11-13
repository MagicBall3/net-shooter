/** Здоровье сущности (игрока). */
export class Health {
  readonly max: number;
  value: number;

  constructor(max = 100) {
    this.max = max;
    this.value = max;
  }

  take(damage: number): number {
    const actual = Math.min(damage, this.value);
    this.value = Math.max(0, this.value - actual);
    return actual;
  }

  heal(amount: number): number {
    const actual = Math.min(amount, this.max - this.value);
    this.value += actual;
    return actual;
  }

  isDead(): boolean {
    return this.value <= 0;
  }

  isFull(): boolean {
    return this.value >= this.max;
  }

  get ratio(): number {
    return this.value / this.max;
  }
}
