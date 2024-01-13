defmodule Golf.Games.Logic do
  # @num_decks 2
  # @hand_size 6

  @card_names for rank <- ~w(A 2 3 4 5 6 7 8 9 T J Q K),
                  suit <- ~w(C D H S),
                  do: rank <> suit

  def new_deck(1), do: @card_names

  def new_deck(n) when n > 1 do
    @card_names ++ new_deck(n - 1)
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
end
