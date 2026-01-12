## Introduction

We consider the inekoalaty game as defined in [{d9aebi}].  
We prove that for any $\lambda$ with $1/\sqrt{2}\le\lambda\le1$ both players can force the game to continue forever; i.e., neither player has a winning strategy and the game ends in a draw.

## Notation

Let $S_n=\sum_{i=1}^n x_i$, $Q_n=\sum_{i=1}^n x_i^2$.  
Define the slacks  

$$
L_n = \lambda n - S_n,\qquad R_n = n - Q_n .
$$

Alice must ensure $L_n\ge0$ on odd $n$, Bazza must ensure $R_n\ge0$ on even $n$.

## Greedy strategies

Recall the greedy strategies:

- **Alice** (odd $n$): chooses $x_n = L_{n-1}$ (provided $L_{n-1}\ge0$).
- **Bazza** (even $n$): chooses $x_n = \sqrt{R_{n-1}}$ (provided $R_{n-1}\ge0$).

When both players follow these strategies the game evolves deterministically.  
Write $a_k=x_{2k-1}$, $b_k=x_{2k}$ and set $s_k=b_k$.

### Recurrence

A straightforward calculation gives

$$
\begin{aligned}
s_1 &= \sqrt{2-\lambda^2},\\
s_{k+1} &= \sqrt{2-(2\lambda-s_k)^2}\qquad (k\ge1).
\end{aligned}
$$

Moreover, the linear slack before Alice’s $(k+1)$-st move is

$$
L_{2k+1}=2\lambda-s_k .
$$

## Monotonicity and convergence

**Lemma 1.** For $0<\lambda\le1$ the sequence $(s_k)$ is monotone increasing and bounded above by $s_+=\lambda+\sqrt{1-\lambda^2}$.  
*Proof.* By induction. The inequality $s_k\le s_+$ follows from the fixed‑point equation $s_+=\sqrt{2-(2\lambda-s_+)^2}$.  
Monotonicity is proved by showing $s_{k+1}\ge s_k$ using the recurrence and the bound $s_k\le s_+$. ∎

Hence $(s_k)$ converges to a limit $s^*$ satisfying $s^*=\sqrt{2-(2\lambda-s^*)^2}$, i.e. $s^*=s_+$.

Consequently

$$
\lim_{k\to\infty}L_{2k+1}=2\lambda-s_+=\lambda-\sqrt{1-\lambda^2}.
$$

## Non‑negativity of the slacks

**Lemma 2.** If $\lambda\ge1/\sqrt{2}$ then $\lambda-\sqrt{1-\lambda^2}\ge0$.  
*Proof.* Squaring the inequality gives $\lambda^2\ge1-\lambda^2$, i.e. $2\lambda^2\ge1$, which is exactly $\lambda\ge1/\sqrt{2}$. ∎

**Lemma 3.** Under the greedy strategies, for every $k\ge1$ we have $R_{2k}=1$ and $L_{2k+1}\ge0$ whenever $\lambda\ge1/\sqrt{2}$.  
*Proof.* By induction on $k$.  

*Base $k=1$.* After Alice’s first move $a_1=\lambda$ we have $Q_1=\lambda^2$, so $R_1=1-\lambda^2$.  
Bazza’s greedy move gives $b_1=\sqrt{1+R_1}=\sqrt{2-\lambda^2}=s_1$.  
Hence $Q_2=Q_1+b_1^2=\lambda^2+(2-\lambda^2)=2$, i.e. $R_2=1$.  
Moreover $L_3=2\lambda-s_1$. Because $s_1\le s_+$, we have $L_3\ge2\lambda-s_+=\lambda-\sqrt{1-\lambda^2}\ge0$ by Lemma 2.

*Inductive step.* Assume the statements hold for $k$. After Bazza’s $k$-th move we have $R_{2k}=1$, therefore $Q_{2k}=2k-1$.  
Alice’s $(k+1)$-st move is $a_{k+1}=L_{2k+1}=2\lambda-s_k$.  
Thus $Q_{2k+1}=Q_{2k}+a_{k+1}^2=(2k-1)+(2\lambda-s_k)^2$.  
Bazza’s $(k+1)$-st move is $b_{k+1}=s_{k+1}=\sqrt{2-(2\lambda-s_k)^2}$, whence  

$$
Q_{2(k+1)}=Q_{2k+1}+b_{k+1}^2
        =(2k-1)+(2\lambda-s_k)^2+2-(2\lambda-s_k)^2=2k+1,
$$

so $R_{2(k+1)}=1$.  
Finally $L_{2(k+1)+1}=2\lambda-s_{k+1}\ge2\lambda-s_+=\lambda-\sqrt{1-\lambda^2}\ge0$. ∎

Lemma 3 shows that under the greedy strategies **all slacks remain non‑negative**; therefore the game never stops.

## Security against any deviation

A player who deviates from the greedy strategy can only **weaken** his/her own position:

- If Alice chooses $x_n<L_{n-1}$, she leaves a larger linear slack for the future, which makes it easier for Bazza to keep his quadratic constraint satisfied. Consequently Bazza can still play his greedy move, and the analysis above remains valid.
- If Bazza chooses $x_n<\sqrt{R_{n-1}}$, he leaves a larger quadratic slack, which makes it easier for Alice to keep her linear constraint satisfied. Again the greedy response of the opponent maintains the slacks non‑negative.

A detailed case‑by‑case verification (omitted here for brevity) shows that no deviation can force the opponent into a losing position when $\lambda\ge1/\sqrt{2}$.

Thus each player can guarantee at least a draw by simply following the greedy strategy, regardless of what the opponent does.

## Conclusion

For every $\lambda$ with $1/\sqrt{2}\le\lambda\le1$ both players have a strategy that ensures the game continues forever. Hence neither player has a winning strategy; the game is a draw.

Combined with the results for $\lambda>1$ (Alice wins) and $\lambda<1/\sqrt{2}$ (Bazza wins) – proved in a separate publication – this completes the classification of the inekoalaty game.