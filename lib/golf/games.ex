defmodule Golf.Games do
  alias Golf.Games.{Game, Round, Event}
  
  @hand_size 6
  @decks_to_use 2

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

  defp num_cards_face_up(hand) do
    Enum.count(hand, & &1["face_up?"])
  end

  # defp all_face_up?(hand) do
  #   num_cards_face_up(hand) == @hand_size
  # end

  # defp one_face_down?(hand) do
  #   num_cards_face_up(hand) == @hand_size - 1
  # end

  def min_two_face_up?(hand) do
    num_cards_face_up(hand) >= 2
  end

  def face_down_cards(hand) do
    hand
    |> Enum.with_index()
    |> Enum.reject(fn {card, _} -> card["face_up?"] end)
    |> Enum.map(fn {_, index} -> String.to_existing_atom("hand_#{index}") end)
  end

  def flip_card(card) do
    %{card | "face_up?" => true}
  end

  def flip_card_at(hand, index) do
    List.update_at(hand, index, &flip_card/1)
  end

  def flip_all(hand) do
    Enum.map(hand, &flip_card/1)
  end

  def current_round(%Game{rounds: [round | _]}), do: round
  
  def current_round(_), do: nil

  defguardp rounds_full(game) when length(game.rounds) >= length(game.players)

  def current_state(%Game{rounds: [round | _]} = game)
      when round.state == :over and rounds_full(game) do
    :game_over
  end

  def current_state(%Game{rounds: [round | _]}), do: round.state
  
  def current_state(%Game{}), do: :no_round

  def can_act?(%Game{rounds: []}, _player), do: false

  def can_act?(%Game{rounds: [round | _]}, player) do
    can_act_round?(round, player)
  end
    
  defp can_act_round?(%Round{state: :round_over}, _player), do: false

  defp can_act_round?(%Round{state: :flip_2} = round, player) do
    hand = get_hand(round, player.id)
    num_cards_face_up(hand) < 2
  end

  defp can_act_round?(%Round{} = round, player) do
    rem(round.turn+1, player.turn+1) == 0    
  end

  defp get_hand(round, player_id) do
    id_str = Integer.to_string(player_id)
    round.hands[id_str]
  end

  def update_hand(hands, player_id, update_fn) do
    id_str = Integer.to_string(player_id)
    Map.update!(hands, id_str, update_fn)
  end

  def new_round(%Game{} = game) do
    deck =
      new_deck(@decks_to_use)
      |> Enum.shuffle()

    num_hand_cards = @hand_size * length(game.players)
    {:ok, hand_cards, deck} = deal_from(deck, num_hand_cards)
    hands = make_hands(hand_cards, game.players)
    
    {:ok, table_cards, deck} = deal_from(deck, 1)

    %Round{
      game_id: game.id,
      state: :flip_2,
      turn: 0,
      deck: deck,
      table_cards: table_cards,
      hands: hands,
      first_player_index: next_first_player_index(game)
    }    
  end

  defp make_hands(cards, players) do
    cards
    |> Enum.map(fn name -> %{"name" => name, "face_up?" => false} end)
    |> Enum.chunk_every(@hand_size)
    |> Enum.zip(player_ids(players))
    |> Enum.reduce(%{}, fn {hand, id}, acc -> Map.put(acc, id, hand) end)
  end

  defp player_ids(players) do
    Enum.map(players, fn p -> Integer.to_string(p.id) end)
  end
  
  defp next_first_player_index(game) do
    case current_round(game) do
      nil ->
        0

      round ->
        num_players = length(game.players)
        rem(round.first_player_index + 1, num_players)
    end
  end

  def playable_cards(%Game{rounds: [round | _]}, player) do
    playable_cards_round(round, player)
  end

  def playable_cards_round(%Round{state: :flip_2} = round, player) do
    hand = get_hand(round, player.id)

    if num_cards_face_up(hand) < 2 do
      face_down_cards(hand)
    else
      []
    end
  end

  def playable_cards_round(round, player) do
    if can_act_round?(round, player) do
      hand = get_hand(round, player.id)
      card_places(round.state, hand)
    else
      []
    end
  end

  @take_card_places [:deck, :table]
  @hold_card_places [:held, :hand_0, :hand_1, :hand_2, :hand_3, :hand_4, :hand_5]

  defp card_places(:take, _), do: @take_card_places
  defp card_places(:hold,  _), do: @hold_card_places
  defp card_places(:flip, hand), do: face_down_cards(hand)

  def round_changes(%Round{state: :flip_2} = round, %Event{action: :flip} = event) do
    update_fn = &flip_card_at(&1, event.hand_index)
    hands = update_hand(round.hands, event.player_id, update_fn)

    all_flipped_two? =
      Map.values(hands)
      |> Enum.all?(&min_two_face_up?/1)

    {state, turn} =
      if all_flipped_two? do
        {:take, round.turn + 1}
      else
        {:flip_2, round.turn}
      end

    %{hands: hands, state: state, turn: turn}
  end  
end
