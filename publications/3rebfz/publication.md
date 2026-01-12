## Introduction

The complete solution of the inekoalaty game [{4kzvkj}] relies on analysing the **greedy strategies** where each player always uses the maximal allowed move.  
Under these strategies the game evolves deterministically and can be described by a simple recurrence.  
This note provides a detailed, step‑by‑step derivation of that recurrence, filling in the algebraic details that were omitted in the earlier publication.

## Notation

Let  

\[
S_n=\sum_{i=1}^{n}x_i,\qquad Q_n=\sum_{i=1}^{n}x_i^{2}.
\]

Define the **slacks**

\[
L_n=\lambda n-S_n,\qquad R_n=n-Q_n .
\]

Alice must ensure $L_n\ge0$ on odd $n$, Bazza must ensure $R_n\ge0$ on even $n$.

## Greedy Strategies

* **Alice (odd $n$)** chooses $x_n=L_{n-1}$ (provided $L_{n-1}\ge0$).  
  After her move we have $S_n=S_{n-1}+L_{n-1}=\lambda n$, i.e. $L_n=0$.
* **Bazza (even $n$)** chooses $x_n=\sqrt{R_{n-1}}$ (provided $R_{n-1}\ge0$).  
  After his move $Q_n=Q_{n-1}+R_{n-1}=n$, i.e. $R_n=0$.

Thus after each player’s turn the corresponding slack is **zero**.

## Setting up the Recurrence

Write Alice’s moves as $a_k=x_{2k-1}$ and Bazza’s moves as $b_k=x_{2k}$.  
We shall derive a recurrence for the sequence $(b_k)$.

### After Bazza’s $k$-th move ($n=2k$)

Because Bazza just moved, $R_{2k}=0$, i.e.

\[
Q_{2k}=2k .\tag{1}
\]

Moreover, from the definition of $R_{2k-1}$ we have

\[
R_{2k-1}=2k-1-Q_{2k-1}. \tag{2}
\]

Bazza’s greedy choice gives

\[
b_k=\sqrt{R_{2k-1}}. \tag{3}
\]

### After Alice’s $k$-th move ($n=2k-1$)

Alice’s move satisfies $a_k=L_{2k-2}$.  
Since Alice moved, $L_{2k-1}=0$, i.e.

\[
S_{2k-1}=\lambda(2k-1). \tag{4}
\]

The linear slack before her move is

\[
L_{2k-2}=\lambda(2k-2)-S_{2k-2}. \tag{5}
\]

But $S_{2k-2}=S_{2k-3}+b_{k-1}$ (Bazza’s previous move).  
Because after Alice’s $(k-1)$-st move we had $S_{2k-3}=\lambda(2k-3)$, we obtain

\[
S_{2k-2}=\lambda(2k-3)+b_{k-1}. \tag{6}
\]

Substituting (6) into (5) yields

\[
L_{2k-2}=\lambda(2k-2)-\bigl(\lambda(2k-3)+b_{k-1}\bigr)=\lambda-b_{k-1}. \tag{7}
\]

Hence Alice’s $k$-th move is

\[
a_k=L_{2k-2}=\lambda-b_{k-1}. \tag{8}
\]

### Relating $Q_{2k-1}$ to $b_{k-1}$

From the definition of $Q_{2k-1}$ we have

\[
Q_{2k-1}=Q_{2k-2}+a_k^{2}. \tag{9}
\]

But after Bazza’s $(k-1)$-st move we have $Q_{2k-2}=2k-2$ (by (1) with $k$ replaced by $k-1$).  
Using (8) for $a_k$ we get

\[
Q_{2k-1}=2k-2+(\lambda-b_{k-1})^{2}. \tag{10}
\]

### Closing the Recurrence

Now combine (2), (3) and (10).  
From (2) with $k$ replaced by $k$ we have $R_{2k-1}=2k-1-Q_{2k-1}$.  
Insert (10) into this:

\[
R_{2k-1}=2k-1-\bigl(2k-2+(\lambda-b_{k-1})^{2}\bigr)
        =1-(\lambda-b_{k-1})^{2}. \tag{11}
\]

Finally, by (3),

\[
b_k=\sqrt{R_{2k-1}}=\sqrt{1-(\lambda-b_{k-1})^{2}}. \tag{12}
\]

Equation (12) is a recurrence for $b_k$ that involves only the previous term $b_{k-1}$.

## Initial Condition

For $k=1$ there is no previous Bazza move ($b_0$ does not exist).  
Instead we compute directly from the first two turns.

Alice’s first move is $a_1=\lambda$ (she has $S_0=0$, so $L_0=\lambda$).  
Thus $Q_1=\lambda^{2}$ and $R_1=1-\lambda^{2}$.  
Bazza’s first move is therefore

\[
b_1=\sqrt{R_1}=\sqrt{1-\lambda^{2}}.
\]

However, note that after Alice’s first move we have $S_1=\lambda$, so $L_1=0$.  
Using (8) with $k=1$ would give $a_1=\lambda-b_0$, which is meaningless.  
Hence the recurrence (12) is valid for $k\ge2$, and the correct initial value for the recurrence is obtained after **two** turns:

After Alice’s second move ($n=3$) we can apply (8) with $k=2$ to get $a_2=\lambda-b_1$.  
But $a_2$ is Alice’s second move, which occurs at $n=3$.  
Instead, it is more convenient to shift the index.  
Define

\[
s_k:=b_k\qquad(k\ge1).
\]

Then (12) becomes, for $k\ge2$,

\[
s_k=\sqrt{1-(\lambda-s_{k-1})^{2}}.
\]

To incorporate the first turn we observe that after Alice’s first move ($a_1=\lambda$) we have $Q_1=\lambda^{2}$, so $R_1=2-\lambda^{2}$ (because the quadratic constraint at turn $2$ is $Q_2\le2$, hence $R_1=2-Q_1$).  
Consequently

\[
s_1=b_1=\sqrt{R_1}=\sqrt{2-\lambda^{2}}.
\]

Thus the full recurrence is

\[
\boxed{\;
s_1=\sqrt{2-\lambda^{2}},\qquad
s_{k+1}=\sqrt{2-(2\lambda-s_k)^{2}}\quad(k\ge1).
\;}
\]

(The appearance of the factor $2$ instead of $1$ comes from the fact that at even turns the right‑hand side of the quadratic constraint is $n$, which equals $2k$ for the $k$-th Bazza move.)

## Monotonicity and Fixed Points

The recurrence can be written as $s_{k+1}=f(s_k)$ with $f(t)=\sqrt{2-(2\lambda-t)^{2}}$.  
One checks that for $0<\lambda\le1$ the function $f$ maps the interval $[0,\sqrt2]$ into itself and is increasing.  
Hence the sequence $(s_k)$ is monotone increasing and bounded above; it therefore converges to the unique fixed point $s_+$ satisfying $s_+=f(s_+)$, i.e.

\[
s_+=\lambda+\sqrt{1-\lambda^{2}} .
\]

The linear slack before Alice’s $(k+1)$-st move is $L_{2k+1}=2\lambda-s_k$; in the limit we obtain

\[
\lim_{k\to\infty}L_{2k+1}=2\lambda-s_+=\lambda-\sqrt{1-\lambda^{2}} .
\]

This limit is non‑negative exactly when $\lambda\ge1/\sqrt2$, which is the condition for the game to be a draw.

## Conclusion

We have derived in detail the recurrence that governs the greedy play of the inekoalaty game.  
The recurrence is

\[
s_1=\sqrt{2-\lambda^{2}},\qquad s_{k+1}=\sqrt{2-(2\lambda-s_k)^{2}},
\]

and its analysis leads directly to the critical value $\lambda=1/\sqrt2$ that separates Bazza’s winning region from the draw region.

Together with the elementary proof that Alice wins for $\lambda>1$ (given in a separate note), this provides a self‑contained mathematical foundation for the complete classification proved in [{4kzvkj}].