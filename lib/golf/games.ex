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

  def current_round(%Game{rounds: [round | _]}), do: round
  def current_round(_), do: nil

  def current_state(%Game{rounds: [round | _]} = game)
      when round.state == :round_over and length(game.rounds) > length(game.players) do
    :game_over
  end

  def current_state(%Game{rounds: [round | _]}), do: round.state
  def current_state(%Game{}), do: :no_round

  def can_act?(%Game{rounds: []}, _player), do: false

  def can_act?(%Game{rounds: [round | _]}, player) do
    can_act_round?(round, player)
  end

  def can_act_round?(%Round{state: :round_over}, _player), do: false

  def can_act_round?(%Round{state: :flip_2} = round, player) do
    hand = get_hand(round.hands, player.id)
    num_cards_face_up(hand) < 2
  end

  def can_act_round?(%Round{} = round, player) do
    num_players = length(Map.values(round.hands))

    rem(round.turn - 1, num_players) ==
      Integer.mod(player.turn - round.first_player_index, num_players)
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

  defp make_hands(card_names, players) do
    card_names
    |> Enum.map(fn name -> %{"name" => name, "face_up?" => false} end)
    |> Enum.chunk_every(@hand_size)
    |> Enum.zip(player_str_ids(players))
    |> Enum.reduce(%{}, fn {hand, player_id}, hands -> Map.put(hands, player_id, hand) end)
  end

  defp player_str_ids(players) do
    Enum.map(players, fn p -> Integer.to_string(p.id) end)
  end

  def get_hand(hands, player_id) do
    id_str = Integer.to_string(player_id)
    hands[id_str]
  end

  defp put_hand(hands, player_id, hand) do
    id_str = Integer.to_string(player_id)
    Map.put(hands, id_str, hand)
  end

  def update_hand(hands, player_id, update_fn) do
    id_str = Integer.to_string(player_id)

    hand =
      hands[id_str]
      |> update_fn.()

    hands = Map.put(hands, id_str, hand)
    {hands, hand}
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

  def game_over?(game)
      when length(game.rounds) == length(game.players) + 1 and
             hd(game.rounds).state == :round_over do
    true
  end

  def game_over?(_), do: false

  def playable_cards(%Game{rounds: [round | _]}, player) do
    playable_cards_round(round, player)
  end

  def playable_cards(_game, _player), do: []

  def playable_cards_round(%Round{state: :flip_2} = round, player) do
    hand = get_hand(round.hands, player.id)

    if num_cards_face_up(hand) < 2 do
      face_down_cards(hand)
    else
      []
    end
  end

  def playable_cards_round(round, player) do
    if can_act_round?(round, player) do
      hand = get_hand(round.hands, player.id)
      card_places(round.state, hand)
    else
      []
    end
  end

  @take_card_places [:deck, :table]
  @hold_card_places [:held, :hand_0, :hand_1, :hand_2, :hand_3, :hand_4, :hand_5]

  defp card_places(:take, _), do: @take_card_places
  defp card_places(:hold, _), do: @hold_card_places
  defp card_places(:flip, hand), do: face_down_cards(hand)

  def round_changes(%Round{state: :flip_2} = round, %Event{action: :flip} = event) do
    update_fn = &flip_card_at(&1, event.hand_index)
    {hands, _} = update_hand(round.hands, event.player_id, update_fn)

    all_flipped_two? =
      Map.values(hands)
      |> Enum.all?(&two_face_up?/1)

    {state, turn} =
      if all_flipped_two? do
        {:take, round.turn + 1}
      else
        {round.state, round.turn}
      end

    %{hands: hands, state: state, turn: turn}
  end

  def round_changes(%Round{state: :flip} = round, %Event{action: :flip} = event) do
    update_fn = &flip_card_at(&1, event.hand_index)
    {hands, hand} = update_hand(round.hands, event.player_id, update_fn)

    {state, turn, first_player_flipped_id} =
      cond do
        Enum.all?(Map.values(hands), &all_face_up?/1) ->
          {:round_over, round.turn, round.first_player_flipped_id}

        all_face_up?(hand) ->
          {:take, round.turn + 1, round.first_player_flipped_id || event.player_id}

        true ->
          {:take, round.turn + 1, round.first_player_flipped_id}
      end

    %{state: state, turn: turn, hands: hands, first_player_flipped_id: first_player_flipped_id}
  end

  def round_changes(%Round{state: :take} = round, %Event{action: :take_deck} = event) do
    {:ok, card, deck} = deal_from(round.deck)

    %{
      state: :hold,
      deck: deck,
      held_card: %{"player_id" => event.player_id, "name" => card}
    }
  end

  def round_changes(%Round{state: :take} = round, %Event{action: :take_table} = event) do
    [card | table_cards] = round.table_cards

    %{
      state: :hold,
      table_cards: table_cards,
      held_card: %{"player_id" => event.player_id, "name" => card}
    }
  end

  def round_changes(
        %Round{state: :hold} = round,
        %Event{action: :discard} = event
      )
      when is_integer(round.first_player_flipped_id) do
    held_card = round.held_card["name"]
    table_cards = [held_card | round.table_cards]
    {hands, _} = update_hand(round.hands, event.player_id, &flip_all/1)

    {state, turn} =
      if Enum.all?(Map.values(hands), &all_face_up?/1) do
        {:round_over, round.turn}
      else
        {:take, round.turn + 1}
      end

    %{
      state: state,
      turn: turn,
      hands: hands,
      held_card: nil,
      table_cards: table_cards
    }
  end

  def round_changes(
        %Round{state: :hold} = round,
        %Event{action: :discard} = event
      )
      when is_nil(round.first_player_flipped_id) do
    hand = get_hand(round.hands, event.player_id)

    {state, turn} =
      cond do
        # TODO handle player going out early
        one_face_down?(hand) ->
          {:take, round.turn + 1}

        true ->
          {:flip, round.turn}
      end

    %{
      state: state,
      turn: turn,
      held_card: nil,
      table_cards: [round.held_card["name"] | round.table_cards]
    }
  end

  def round_changes(
        %Round{state: :hold} = round,
        %Event{action: :swap} = event
      ) do
    player_out? = is_integer(round.first_player_flipped_id)

    {hand, card} =
      round.hands
      |> get_hand(event.player_id)
      |> maybe_flip_all(player_out?)
      |> swap_card(event.hand_index, round.held_card["name"])

    hands = put_hand(round.hands, event.player_id, hand)
    table_cards = [card | round.table_cards]

    {state, turn, first_player_flipped_id} =
      cond do
        Enum.all?(Map.values(hands), &all_face_up?/1) ->
          {:round_over, round.turn, round.first_player_flipped_id || event.player_id}

        all_face_up?(hand) ->
          {:take, round.turn + 1, round.first_player_flipped_id || event.player_id}

        true ->
          {:take, round.turn + 1, round.first_player_flipped_id}
      end

    %{
      state: state,
      turn: turn,
      held_card: nil,
      hands: hands,
      table_cards: table_cards,
      first_player_flipped_id: first_player_flipped_id
    }
  end

  def action_at(state, "hand") when state in [:flip_2, :flip], do: :flip
  def action_at(:take, "table"), do: :take_table
  def action_at(:take, "deck"), do: :take_deck
  def action_at(:hold, "table"), do: :discard
  def action_at(:hold, "held"), do: :discard
  def action_at(:hold, "hand"), do: :swap

  def find_player_by_user_id(players, user_id) do
    Enum.find(players, fn p -> p.user_id == user_id end)
  end

  def find_user_turn(players, user_id) do
    player = find_player_by_user_id(players, user_id)
    player && player.turn + 1
  end

  def total_scores(%Game{rounds: []} = game) do
    Enum.map(game.players, &Map.put(&1, :total_score, 0))
  end

  def total_scores(game) do
    game.players
    |> Enum.map(fn player ->
      score =
        Enum.reduce(game.rounds, 0, fn round, acc ->
          hand = get_hand(round.hands, player.id)
          acc + score(hand)
        end)

      Map.put(player, :total_score, score)
    end)
    |> Enum.sort(fn p1, p2 -> p1.total_score < p2.total_score end)
  end

  def round_scores(%Game{rounds: []} = game) do
    # if there are no rounds, give each player a score of 0
    [
      Enum.map(game.players, &Map.put(&1, :score, 0))
      |> List.wrap()
    ]
  end

  def round_scores(game) do
    Enum.map(game.rounds, &put_scores(&1, game.players))
  end

  def put_scores(round, players) do
    players
    |> Enum.map(fn p -> Map.put(p, :score, player_score(round.hands, p.id)) end)
    |> double_set_player_score(round)
    |> Enum.sort(fn p1, p2 -> p1.score < p2.score end)
  end

  @doc """
  If a player flips all their cards first and then loses they are "set".
  If a player is set, their score is doubled.
  """
  def double_set_player_score(players, round) when round.state == :round_over do
    Enum.map(players, fn p ->
      if p.id == round.first_player_flipped_id and p.score > 0 and any_lower_score?(players, p) do
        Map.update!(p, :score, &(&1 * 2))
      else
        p
      end
    end)
  end

  def double_set_player_score(players, _), do: players

  def any_lower_score?(players, player) do
    players
    # |> Enum.filter(&(&1.id == player.id))
    # |> Enum.reject(&(&1.id == player.id))
    |> Enum.any?(&(&1.score < player.score))
  end

  def player_score(hands, player_id) do
    hand = get_hand(hands, player_id)
    score(hand)
  end

  def score(hand) do
    hand
    |> Enum.map(&rank_if_face_up/1)
    |> score_ranks(0)
  end

  # "AS" -> ace of spades, "KH" -> king of hearts etc.
  # The rank is the first char of the name. rank "AS" -> ?A
  # rank_if_face_up?(%{"face_up" => true, "name" => "AS"}) == ?A
  defp rank_if_face_up(%{"face_up?" => true, "name" => <<rank, _>>}), do: rank
  defp rank_if_face_up(_), do: nil

  defp rank_value(rank) when is_integer(rank) do
    case rank do
      ?j -> -2
      ?K -> 0
      ?A -> 1
      ?2 -> 2
      ?3 -> 3
      ?4 -> 4
      ?5 -> 5
      ?6 -> 6
      ?7 -> 7
      ?8 -> 8
      ?9 -> 9
      r when r in [?T, ?J, ?Q] -> 10
    end
  end

  # Each hand consists of two rows of three cards.
  # Face down cards are represented by nil and ignored.
  # If the cards are face up and in a matching column, they are worth 0 points and discarded.

  # Special cases:
  #   6 of a kind -> -40 pts
  #   4 of a kind (outer cols) -> -20 pts
  #   4 of a kind (adjacent cols) -> -10 pts

  # The rank value of each remaining face up card is totaled together.
  defp score_ranks(ranks, total) do
    case ranks do
      # all match, -40 points
      [a, a, a, a, a, a] when is_integer(a) ->
        -40

      [?j, b, ?j, ?j, c, ?j] ->
        score_ranks([b, c], -28)

      # outer cols match, -20 points
      [a, b, a, a, c, a] when is_integer(a) ->
        score_ranks([b, c], total - 20)

      [?j, ?j, a, ?j, ?j, b] ->
        score_ranks([a, b], total - 18)

      # left 2 cols match, -10 points
      [a, a, b, a, a, c] when is_integer(a) ->
        score_ranks([b, c], total - 10)

      [a, ?j, ?j, b, ?j, ?j] ->
        score_ranks([a, b], total - 18)

      # right 2 cols match, -10 points
      [a, b, b, c, b, b] when is_integer(b) ->
        score_ranks([a, c], total - 10)

      [?j, b, c, ?j, d, e] ->
        score_ranks([b, c, d, e], total - 4)

      # left col match
      [a, b, c, a, d, e] when is_integer(a) ->
        score_ranks([b, c, d, e], total)

      [a, ?j, c, d, ?j, e] ->
        score_ranks([a, c, d, e], total - 4)

      # middle col match
      [a, b, c, d, b, e] when is_integer(b) ->
        score_ranks([a, c, d, e], total)

      [a, b, ?j, d, e, ?j] ->
        score_ranks([a, b, d, e], total - 4)

      # right col match
      [a, b, c, d, e, c] when is_integer(c) ->
        score_ranks([a, b, d, e], total)

      [?j, b, ?j, c] ->
        score_ranks([b, c], total - 4)

      # left col match, pass 2
      [a, b, a, c] when is_integer(a) ->
        score_ranks([b, c], total)

      [a, ?j, c, ?j] ->
        score_ranks([a, c], total - 4)

      # right col match, pass 2
      [a, b, c, b] when is_integer(b) ->
        score_ranks([a, c], total)

      [?j, ?j] ->
        total - 4

      # match, pass 3
      [a, a] when is_integer(a) ->
        total

      # no matches, add the rank val of each face up card to the total
      _ ->
        ranks
        |> Enum.reject(&is_nil/1)
        |> Enum.reduce(total, fn rank, acc -> rank_value(rank) + acc end)
    end
  end

  defp num_cards_face_up(hand) do
    Enum.count(hand, & &1["face_up?"])
  end

  defp all_face_up?(hand) do
    num_cards_face_up(hand) == @hand_size
  end

  defp one_face_down?(hand) do
    num_cards_face_up(hand) == @hand_size - 1
  end

  defp two_face_up?(hand) do
    num_cards_face_up(hand) >= 2
  end

  defp face_down_cards(hand) do
    hand
    |> Enum.with_index()
    |> Enum.reject(fn {card, _} -> card["face_up?"] end)
    |> Enum.map(fn {_, index} -> String.to_existing_atom("hand_#{index}") end)
  end

  defp flip_card(card) do
    %{card | "face_up?" => true}
  end

  defp flip_card_at(hand, index) do
    List.update_at(hand, index, &flip_card/1)
  end

  defp flip_all(hand) do
    Enum.map(hand, &flip_card/1)
  end

  defp maybe_flip_all(hand, true), do: flip_all(hand)
  defp maybe_flip_all(hand, _), do: hand

  defp swap_card(hand, index, new_card) do
    old_card = Enum.at(hand, index)["name"]
    hand = List.replace_at(hand, index, %{"name" => new_card, "face_up?" => true})
    {hand, old_card}
  end
end
