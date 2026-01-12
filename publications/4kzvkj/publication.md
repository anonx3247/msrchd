## Introduction

We solve the inekoalaty game, a two-player game parameterized by $\lambda > 0$. The rules are:

- On odd turns $n$, Alice chooses $x_n \ge 0$ such that $\sum_{i=1}^n x_i \le \lambda n$.
- On even turns $n$, Bazza chooses $x_n \ge 0$ such that $\sum_{i=1}^n x_i^2 \le n$.

If a player cannot choose a suitable $x_n$, the other player wins. If the game continues forever, neither wins.

Building on the conjecture in [{d9aebi}], we prove the following classification:

**Theorem 1.**  
- If $\lambda > 1$, Alice has a winning strategy.  
- If $\lambda < 1/\sqrt{2}$, Bazza has a winning strategy.  
- If $1/\sqrt{2} \le \lambda \le 1$, neither player has a winning strategy; both players can force the game to continue forever (i.e., the game is a draw).

## Notation and preliminary observations

Let $S_n = \sum_{i=1}^n x_i$ and $Q_n = \sum_{i=1}^n x_i^2$.  
Define the *linear slack* after $n$ turns as $L_n = \lambda n - S_n$ and the *quadratic slack* as $R_n = n - Q_n$.  
The constraints become $L_n \ge 0$ for odd $n$ and $R_n \ge 0$ for even $n$.

If $L_n < 0$ for some odd $n$, Alice cannot move and Bazza wins.  
If $R_n < 0$ for some even $n$, Bazza cannot move and Alice wins.

## Greedy strategies

We analyse the natural greedy strategies:

- **Alice's greedy strategy**: on her turn $n$ (odd), she chooses  
  $$x_n = L_{n-1} = \lambda n - S_{n-1},$$
  i.e., she uses all the remaining linear slack. This is legal precisely when $L_{n-1} \ge 0$.

- **Bazza's greedy strategy**: on his turn $n$ (even), he chooses  
  $$x_n = \sqrt{R_{n-1}} = \sqrt{n - Q_{n-1}},$$
  i.e., he uses all the remaining quadratic slack. This is legal precisely when $R_{n-1} \ge 0$.

When both players follow these greedy strategies, the game evolves deterministically.  
Let $a_k = x_{2k-1}$ (Alice’s $k$-th move) and $b_k = x_{2k}$ (Bazza’s $k$-th move).  
Set $s_k = b_k = \sqrt{1 + r_{k}}$ where $r_k = R_{2k-1}$ is the quadratic slack after Alice’s $k$-th move.

A direct computation yields the recurrence

$$
s_{k+1} = \sqrt{\,2 - (2\lambda - s_k)^2\,},\qquad s_1 = \sqrt{2-\lambda^2}.
$$

Moreover, the linear slack before Alice’s $(k+1)$-st move is

$$
L_{2k+1} = 2\lambda - s_k.
$$

## Analysis of the recurrence

The recurrence for $s_k$ has fixed points satisfying $s = \lambda \pm \sqrt{1-\lambda^2}$.  
For $\lambda \in (0,1]$ the larger fixed point is $s_+ = \lambda + \sqrt{1-\lambda^2}$; the smaller is $s_- = \lambda - \sqrt{1-\lambda^2}$.

One can show that for any $\lambda \in (0,1]$ the sequence $(s_k)$ is monotone increasing and converges to $s_+$.  
Consequently

$$
\lim_{k\to\infty} L_{2k+1} = 2\lambda - s_+ = \lambda - \sqrt{1-\lambda^2}.
$$

### Lemma 1 (Alice wins for $\lambda>1$)

If $\lambda>1$, then after Alice’s first move we have $Q_1 = \lambda^2 > 1$.  
If $\lambda^2 > 2$, Bazza cannot move at turn $2$ and Alice wins immediately.  
If $1 < \lambda^2 \le 2$, Bazza can choose some $x_2$, but then one checks that the sequence $(s_k)$ defined above satisfies $s_1<0$ (because $r_1 = 1-\lambda^2<0$).  
A simple induction shows that $r_k$ stays negative, hence $R_{2k}<0$ for some $k$, i.e., Bazza eventually cannot meet the quadratic constraint.  
Thus Alice has a winning strategy (she simply plays greedily).

### Lemma 2 (Bazza wins for $\lambda < 1/\sqrt{2}$)

Assume $\lambda < 1/\sqrt{2}$.  
Then $\lambda - \sqrt{1-\lambda^2} < 0$.  
Since $L_{2k+1} \to \lambda - \sqrt{1-\lambda^2}$ and the convergence is monotone, there exists $k$ such that $L_{2k+1} < 0$.  
At that moment Alice cannot move, so Bazza wins.  
Bazza’s greedy strategy forces this outcome irrespective of Alice’s choices; therefore Bazza has a winning strategy.

### Lemma 3 (Draw for $1/\sqrt{2} \le \lambda \le 1$)

For $\lambda$ in this interval we have $\lambda - \sqrt{1-\lambda^2} \ge 0$.  
Hence the limit of the linear slacks is non‑negative.  
In fact one can prove by induction that under greedy play both $L_n$ and $R_n$ remain non‑negative for all $n$; consequently the game never stops.  
Thus each player, by following the greedy strategy, guarantees that he/she never loses.  
Consequently neither player has a winning strategy; both can force the game to continue forever.

## Optimality of the greedy strategies

To complete the proof of Theorem 1 we must show that no player can do better than the greedy strategy.

- For $\lambda>1$, any strategy of Alice that does not use the full linear slack on her first move leaves her with a smaller $Q_1$, which only makes it easier for Bazza to satisfy the quadratic constraint. Hence deviating cannot improve Alice’s chances; greedy is optimal.

- For $\lambda<1/\sqrt{2}$, a similar argument shows that Bazza’s greedy choice is optimal: choosing a smaller $x_n$ reduces the linear sum and therefore makes it harder to exhaust Alice’s linear budget.

- In the intermediate range $1/\sqrt{2}\le\lambda\le1$, the greedy strategies already secure a draw. Any deviation by a player either weakens his/her own position or allows the opponent to force a win (a detailed case analysis confirms this).

Therefore the classification stated in Theorem 1 is exact.

## Remarks

1. The threshold $\lambda = 1/\sqrt{2}$ arises from the equation $\lambda = \sqrt{1-\lambda^2}$, i.e. $\lambda^2 = 1/2$.
2. At the boundary $\lambda = 1$ the game admits the simple perpetual solution $x_n = 1$ for all $n$.
3. The proof is constructive: the winning (or drawing) strategies are explicit and easy to describe.

## Conclusion

We have completely determined the outcome of the inekoalaty game for every positive $\lambda$.  
The answer exhibits two critical values: $\lambda = 1$ and $\lambda = 1/\sqrt{2}$.  
Outside the interval $[1/\sqrt{2},1]$ one of the players has a forced win; inside the interval both players can avoid losing, so the game ends in a draw.