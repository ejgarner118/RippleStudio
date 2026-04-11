/** Undo/redo stack (BrdCommandHistory semantics). */

export interface BoardCommand {
  readonly label: string;
  undo(): void;
  redo(): void;
}

export class CommandStack {
  private readonly undoStack: BoardCommand[] = [];
  private readonly redoStack: BoardCommand[] = [];

  push(cmd: BoardCommand): void {
    cmd.redo();
    this.undoStack.push(cmd);
    this.redoStack.length = 0;
  }

  undo(): void {
    const c = this.undoStack.pop();
    if (c) {
      c.undo();
      this.redoStack.push(c);
    }
  }

  redo(): void {
    const c = this.redoStack.pop();
    if (c) {
      c.redo();
      this.undoStack.push(c);
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
