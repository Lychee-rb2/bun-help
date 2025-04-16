import logUpdate from "log-update";

export default class Stdout {
  line: Record<string, string[]> = {};

  get width() {
    return (
      this.columns.reduce((a, b) => a + b, 0) +
      " | ".length * (this.columns.length - 1) +
      "| ".length +
      " |".length
    );
  }

  get columns() {
    const allLength = Object.entries(this.line).map(([key, value]) => [
      key.length,
      ...value.map((v) => v.length),
    ]);
    const length = Math.max(...allLength.map((i) => i.length));
    return Array.from({ length }, (_, i) =>
      Math.max(...allLength.map((j) => j[i])),
    );
  }

  constructor(public group: string[]) {
    this.init();
  }

  format(name: string, value: string[]) {
    return `| ${[name, ...value].map((i, index) => i.trim().padEnd(this.columns[index], " ")).join(" | ")} |`;
  }

  init() {
    this.group.forEach((i) => (this.line[i] = []));
    this.log();
  }

  log() {
    logUpdate(
      [
        "".padStart(this.width, "-"),
        ...this.group.map((i) => this.format(i, this.line[i])),
        "".padStart(this.width, "-"),
      ].join("\n"),
    );
  }

  update(name: string, value: string[]) {
    this.line[name] = value;
    this.log();
  }
}
