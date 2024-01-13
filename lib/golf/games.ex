defmodule Golf.Games do
  alias Golf.Games.Game

  @card_names for rank <- ~w(A 2 3 4 5 6 7 8 9 T J Q K),
                  suit <- ~w(C D H S),
                  do: rank <> suit

  @joker_name "jk"
  @jokers_per_deck 2
  @jokers List.duplicate(@joker_name, @jokers_per_deck)

  def new_deck(1) do
    @card_names ++ @jokers
  end

  def new_deck(n) when n > 1 do
    new_deck(1) ++ new_deck(n - 1)
  end

  def new_deck(), do: new_deck(1)

  def deal_from([], _) do
    {:error, :empty_deck}
  end

  def deal_from(deck, n) when length(deck) < n do
    {:error, :not_enough_cards}
  end

  def deal_from(deck, n) do
    {cards, deck} = Enum.split(deck, n)
    {:ok, cards, deck}
  end

  def deal_from(deck) do
    with {:ok, [card], deck} <- deal_from(deck, 1) do
      {:ok, card, deck}
    end
  end

  def current_round(%Game{rounds: [round | _]}), do: round
  def current_round(_), do: nil

  defguard rounds_full(game) when length(game.rounds) >= length(game.players)

  def current_state(%Game{rounds: [round | _]} = game)
      when round.state == :over and rounds_full(game) do
    :game_over
  end

  def current_state(%Game{rounds: [round | _]}), do: round.state
  def current_state(%Game{}), do: :no_round
end
