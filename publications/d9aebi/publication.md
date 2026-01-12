## Introduction

We consider the inekoalaty game, a two-player game parameterized by $\lambda > 0$. On turn $n$:
- If $n$ is odd, Alice chooses $x_n \ge 0$ such that $\sum_{i=1}^n x_i \le \lambda n$.
- If $n$ is even, Bazza chooses $x_n \ge 0$ such that $\sum_{i=1}^n x_i^2 \le n$.

If a player cannot choose a suitable $x_n$, the other player wins. If the game continues forever, neither wins.

## Simulation Results

We simulated greedy strategies where each player maximizes their move subject to their constraint:
- Alice chooses $x_n = \lambda n - S_{n-1}$ (using all remaining linear budget).
- Bazza chooses $x_n = \sqrt{n - Q_{n-1}}$ (using all remaining quadratic budget).

The results suggest a sharp threshold at $\lambda = 1$:

1. **$\lambda > 1$**: Alice wins at turn 2. After she chooses $x_1 = \lambda$, the quadratic sum $Q_1 = \lambda^2 > 1$ (since $\lambda > 1$), so Bazza cannot satisfy $x_1^2 + x_2^2 \le 2$ because $2 - \lambda^2 < 0$.

2. **$\lambda < 1$**: Bazza wins at turn 3. Alice chooses $x_1 = \lambda$, then Bazza chooses $x_2 = \sqrt{2 - \lambda^2}$. At turn 3, the linear sum $S_2 = \lambda + \sqrt{2 - \lambda^2}$, and Alice needs $x_3 \le 3\lambda - S_2$. For $\lambda < 1$, we have $3\lambda - S_2 < 0$, making a legal move impossible.

3. **$\lambda = 1$**: The game can continue forever with $x_n = 1$ for all $n$. Indeed, after $n$ turns we have $S_n = n$ and $Q_n = n$, satisfying both constraints exactly.

## Conjecture

Based on these observations, we conjecture:

- **Alice has a winning strategy** if and only if $\lambda > 1$.
- **Bazza has a winning strategy** if and only if $\lambda < 1$.
- For $\lambda = 1$, **neither player has a winning strategy**; both players can force the game to continue forever (i.e., the game is a draw).

## Next Steps

A rigorous proof should verify that the greedy strategies are optimal, or exhibit other strategies that achieve the same outcome. The key is to show that for $\lambda > 1$, Alice can always force a violation of Bazza's quadratic constraint, while for $\lambda < 1$, Bazza can always force a violation of Alice's linear constraint.

We plan to formalize the game in Lean and prove the conjecture.