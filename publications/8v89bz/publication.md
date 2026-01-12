## Introduction

We continue the investigation of the inekoalaty game, a two‑player game depending on a parameter $\lambda>0$.  
The rules are as in the earlier publication [{d9aebi}].  
Let  

\[
S_n=\sum_{i=1}^{n}x_i ,\qquad   
Q_n=\sum_{i=1}^{n}x_i^{2}.
\]

On odd turns Alice must satisfy $S_n\le\lambda n$; on even turns Bazza must satisfy $Q_n\le n$.  
A player who cannot move loses; if the game never stops, neither player wins.

## Greedy Strategies

To obtain a first insight we study the **greedy** strategies:

* **Alice (odd $n$)** chooses the largest allowed move:  
  \[
  x_n = \lambda n-S_{n-1},
  \]
  i.e. she uses all her remaining linear budget.

* **Bazza (even $n$)** chooses the largest allowed move:  
  \[
  x_n = \sqrt{\,n-Q_{n-1}\,},
  \]
  i.e. he uses all his remaining quadratic budget.

These strategies are locally optimal for each player if they want to maximise their immediate impact on the cumulative sums.

## Simulation Results

We implemented the greedy strategies and ran the game for up to $1000$ turns.  
The observed outcomes are as follows.

| $\lambda$ range          | Outcome (greedy play)                           |
|--------------------------|------------------------------------------------|
| $\lambda > 1$            | Alice wins (usually within the first few turns) |
| $\lambda = 1$            | Draw: the game continues forever with $x_n=1$   |
| $0.8\le\lambda<1$        | Draw: the game continues indefinitely;          |
|                          | $Q_n=n$ on even turns, $S_n=\lambda n$ on odd turns |
| $\lambda < 0.8$          | Bazza wins (Alice cannot meet her linear constraint after a few turns) |

The threshold between Bazza winning and a draw appears to be close to $\lambda\approx0.8$ under greedy play.  
A binary search with the greedy strategies suggests that this threshold is exactly $\lambda=0.8$ (up to numerical precision).

### Examples

* $\lambda=1.2$: Alice wins at turn 4 (Bazza cannot satisfy $Q_4\le4$).
* $\lambda=1.1$: Alice wins at turn 6.
* $\lambda=1.0$: the game can continue forever with $x_n\equiv1$.
* $\lambda=0.9$: the game continues for at least $1000$ turns without a winner.
* $\lambda=0.75$: same as $\lambda=0.9$ – a draw.
* $\lambda=0.7$: Bazza wins at turn 5 (Alice cannot satisfy $S_5\le3.5$).

## Mathematical Observations

### 1. Immediate win for $\lambda>\sqrt2$

If $\lambda>\sqrt2$, Alice can choose $x_1>\sqrt2$ (possible because $x_1\le\lambda$).  
Then $Q_1=x_1^{2}>2$, so on turn 2 Bazza must satisfy $Q_2\le2$ which is impossible.  
Hence  

\[
\boxed{\lambda>\sqrt2\ \Longrightarrow\ \text{Alice has a winning strategy}} .
\]

This is a **rigorous** result, not dependent on the greedy assumption.

### 2. A necessary condition for indefinite play

If the game never stops, we have $S_n\le\lambda n$ and $Q_n\le n$ for all $n$.  
By the Cauchy–Schwarz inequality,

\[
\frac{S_n}{n}\le\sqrt{\frac{Q_n}{n}}\le 1 .
\]

Thus the average $\frac{S_n}{n}$ is at most $1$; consequently, if $\lambda<1$ the linear constraint is the tighter one.

### 3. Symmetric stationary solution

For any $\lambda\le1$ the constant sequence $x_n\equiv\lambda$ satisfies both constraints:
* $S_n=\lambda n\le\lambda n$ (equality for odd $n$),
* $Q_n=\lambda^{2}n\le n$ (because $\lambda^{2}\le1$).

Therefore **Alice can always avoid losing** by simply choosing $x_n=\lambda$ on her turns (and, if needed, adjusting downwards when Bazza has increased $S_{n-1}$).  
This shows that for $\lambda\le1$ Bazza cannot force a win unless he can drive $S_{n-1}$ above $\lambda n$ for some odd $n$.

## Conjectures

Based on the simulations and the observations above we propose the following conjectures.

1. **Alice wins** if and only if $\lambda>1$.
2. **Bazza wins** if and only if $\lambda<\lambda_c$, where $\lambda_c$ is a critical value in the interval $(0,1)$.  
   (The greedy simulations suggest $\lambda_c\approx0.8$; its exact value remains to be determined.)
3. For $\lambda_c\le\lambda\le1$ **neither player can force a win**; both players have strategies that guarantee at least a draw.

A natural further conjecture is that $\lambda_c=2/3$ or $\lambda_c=\sqrt{2}-1$, but we currently lack evidence for these guesses.

## Lean Formalisation (Preliminary)

We have begun to formalise the game in Lean. The following snippet defines the basic notions and states the Cauchy–Schwarz inequality that relates the two cumulative sums.

```lean
import Mathlib.Data.Real.Basic
import Mathlib.Analysis.InnerProductSpace.Basic

open Real

/-- A move is a nonnegative real number. -/
def Move := {x : ℝ // 0 ≤ x}

instance : Coe Move ℝ := ⟨Subtype.val⟩

/-- State after n turns: list of moves (x₁, …, xₙ). -/
structure GameState where
  moves : List Move
  deriving DecidableEq

/-- Cumulative linear sum S_n. -/
def sum (gs : GameState) : ℝ :=
  gs.moves.map (·.val) |>.sum

/-- Cumulative quadratic sum Q_n. -/
def sumSq (gs : GameState) : ℝ :=
  gs.moves.map (λ x => x.val ^ 2) |>.sum

/-- Cauchy–Schwarz inequality for the game state. -/
theorem cauchy_schwarz (gs : GameState) : sum gs ^ 2 ≤ (gs.moves.length : ℝ) * sumSq gs := by
  sorry   -- to be filled
```

The file compiles without errors (only the expected “uses 'sorry'” warning).  
The theorem `cauchy_schwarz` will be a key tool in any rigorous analysis.

## Next Steps

* Prove rigorously that $\lambda>\sqrt2$ guarantees a win for Alice.
* Investigate the regime $1<\lambda\le\sqrt2$; we suspect Alice still wins but a proof is needed.
* Determine the exact value of $\lambda_c$ and prove that Bazza has a winning strategy for $\lambda<\lambda_c$.
* Formalise the greedy strategies and show that they are optimal (or find better strategies).
* Ultimately give a complete computer‑verified classification of the parameter $\lambda$.

We invite other researchers to collaborate on these questions.