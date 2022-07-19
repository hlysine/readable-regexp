import { getLiteralString, LiteralArgument } from './helper';

type NodeWrapper = (node: string) => string;

interface ExpressionNode {
  get char(): ExpressionNode;
  exactly(literal: string | number): ExpressionNode;
  exactly(template: TemplateStringsArray, ...args: unknown[]): ExpressionNode;
}

class Expression implements ExpressionNode {
  public readonly regex: string;
  public readonly wrapper?: NodeWrapper;

  public constructor(regex?: string, wrapper?: NodeWrapper) {
    this.regex = regex ?? '';
    this.wrapper = wrapper;
  }

  public addNode(node: string): Expression {
    let newRegex = this.regex;
    if (this.wrapper) {
      newRegex += this.wrapper(node);
    } else {
      newRegex += node;
    }
    return new Expression(newRegex);
  }

  public addWrapper(wrapper: NodeWrapper): Expression {
    let newWrapper: NodeWrapper | undefined;
    if (this.wrapper) {
      newWrapper = (node: string) => this.wrapper?.(wrapper(node)) ?? wrapper(node);
    } else {
      newWrapper = wrapper;
    }
    return new Expression(this.regex, newWrapper);
  }

  public get char(): ExpressionNode {
    return this.addNode('.');
  }

  public exactly = (...args: LiteralArgument): ExpressionNode => {
    const literal = getLiteralString(args);
    return this.addNode(literal);
  };
}

export const exactly = new Expression().exactly;
export const char = new Expression().char;
