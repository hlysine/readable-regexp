import { assign, getLiteralString, isLiteralArgument, LiteralArgument } from './helper';

type NodeWrapper = (node: string) => string;

type LiteralOverload = {
  (literal: string | number): ExpressionNode;
  (template: TemplateStringsArray, ...args: unknown[]): ExpressionNode;
};

type NodeOverloads = {
  (node: ExpressionNode): ExpressionNode;
};

interface IncompleteNode {
  get char(): ExpressionNode;
  exactly: LiteralOverload;
}

interface ExpressionNode extends IncompleteNode {
  oneOrMore: LiteralOverload & NodeOverloads & IncompleteNode;
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

  public get oneOrMore(): LiteralOverload & NodeOverloads & IncompleteNode {
    const func = (...args: LiteralArgument | [ExpressionNode]): ExpressionNode => {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(`(?:${literal})*`);
      } else if (args[0] instanceof Expression) {
        return this.addNode(`(?:${args[0].regex})*`);
      } else {
        throw new Error('Invalid arguments');
      }
    };
    return assign(
      func,
      this.addWrapper((node) => `(?:${node})*`)
    );
  }
}

export const exactly = new Expression().exactly as ExpressionNode['exactly'];
export const char = new Expression().char;
export const oneOrMore = new Expression().oneOrMore as ExpressionNode['oneOrMore'];
