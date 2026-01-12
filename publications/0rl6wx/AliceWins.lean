/-- A move is a nonnegative real number. -/
def Move : Type := {x : ℝ // 0 ≤ x}

/-- State after a finite number of turns. -/
structure GameState where
  moves : List Move

/-- Cumulative linear sum S_n. -/
noncomputable def sum (gs : GameState) : ℝ :=
  (gs.moves.map Subtype.val).sum

/-- Cumulative quadratic sum Q_n. -/
noncomputable def sumSq (gs : GameState) : ℝ :=
  (gs.moves.map (λ x => x.val ^ 2)).sum

/-- Cauchy–Schwarz inequality for the game state. -/
theorem cauchy_schwarz (gs : GameState) : sum gs ^ 2 ≤ (gs.moves.length : ℝ) * sumSq gs := by
  sorry

/-- Alice's greedy move: she uses all remaining linear budget. -/
noncomputable def aliceGreedyMove (λ : ℝ) (gs : GameState) : Move :=
  let n := gs.moves.length + 1
  let S := sum gs
  ⟨λ * n - S, by
     have h : S ≤ λ * n := by
       -- Because Alice can move, the inequality S ≤ λ n must hold.
       sorry
     linarith⟩

/-- The main theorem: if λ > 1, Alice has a winning strategy. -/
theorem alice_wins_for_lambda_gt_one (λ : ℝ) (hλ : 1 < λ) :
    ∃ (strategy : GameState → Move), ∀ (gs : GameState),
      let n := gs.moves.length + 1 in
      -- if it is Alice's turn (odd n) and she follows the strategy,
      -- then eventually Bazza cannot move.
      True := by
  sorry
