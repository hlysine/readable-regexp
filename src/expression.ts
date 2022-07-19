import { getLiteralString, LiteralArgument } from './helper';

type NodeWrapper = (node: string) => string;

interface ExpressionNode {
  exactly(literal: string | number): ExpressionNode;
  exactly(template: TemplateStringsArray, ...args: unknown[]): ExpressionNode;
}

class Expression implements ExpressionNode {
  public regex: string;
  public wrapper?: NodeWrapper;

  public constructor(regex?: string) {
    this.regex = regex ?? '';
  }

  public addNode(node: string): Expression {
    if (this.wrapper) {
      this.regex += this.wrapper(node);
    } else {
      this.regex += node;
    }
    return this;
  }

  public addWrapper(wrapper: NodeWrapper): Expression {
    if (this.wrapper) {
      this.wrapper = (node: string) => this.wrapper?.(wrapper(node)) ?? wrapper(node);
    } else {
      this.wrapper = wrapper;
    }
    return this;
  }

  public exactly(...args: LiteralArgument): ExpressionNode {
    const literal = getLiteralString(args);
    return this.addNode(literal);
  }
}

export function exactly(literal: string | number): ExpressionNode;
export function exactly(template: TemplateStringsArray, ...args: unknown[]): ExpressionNode;
export function exactly(...args: LiteralArgument): ExpressionNode {
  return new Expression().exactly(...args);
}
