defmodule Golf.Games.GameData do
  @moduledoc """
  The game data that will be sent to the client.
  """

  alias Golf.Games

  @derive Jason.Encoder
  defstruct [
    :id,
    :hostId,
    :turn,
    :state,
    :deck,
    :tableCards,
    :players,
    :playerId,
    :userIsHost,
    :playableCards,
    :isFlipped
  ]

  def new(game, user) do
    player_index = Enum.find_index(game.players, fn p -> p.user.id == user.id end)
    player = if player_index, do: Enum.at(game.players, player_index)

    round = Games.current_round(game)
    positions = player_positions(length(game.players))

    players =
      game.players
      |> put_hands_scores(round && round.hands)
      |> maybe_rotate(player_index)
      |> Enum.map(&put_player_data(&1, round))
      |> Enum.zip_with(positions, &Map.put(&1, :position, &2))

    playable_cards =
      if round && player do
        Games.playable_cards_round(round, player)
      else
        []
      end

    %__MODULE__{
      id: game.id,
      hostId: game.host_id,
      turn: round && round.turn,
      state: Games.current_state(game),
      deck: round && round.deck,
      tableCards: round && round.table_cards,
      players: players,
      playerId: player && player.id,
      userIsHost: user.id == game.host_id,
      playableCards: playable_cards,
      isFlipped: round && is_integer(round.first_player_out_id)
    }
  end

  defp rotate(list, n) do
    {left, right} = Enum.split(list, n)
    right ++ left
  end

  defp maybe_rotate(list, n) when n in [0, nil], do: list
  defp maybe_rotate(list, n), do: rotate(list, n)

  defp player_positions(num_players) do
    case num_players do
      1 -> ~w(bottom)
      2 -> ~w(bottom top)
      3 -> ~w(bottom left right)
      4 -> ~w(bottom left top right)
    end
  end

  defp put_player_data(player, nil) do
    player
    |> Map.put(:can_act?, false)
  end

  defp put_player_data(player, round) do
    player
    |> maybe_put_held_card(round && round.held_card)
    |> Map.put(:can_act?, Games.can_act_round?(round, player))
  end

  defp maybe_put_held_card(player, %{"player_id" => card_owner} = card)
       when player.id == card_owner do
    %{player | held_card: card["name"]}
  end

  defp maybe_put_held_card(player, _), do: player

  defp put_hands_scores(players, hands) do
    Enum.map(players, &put_hand_score(&1, Games.get_hand(hands, &1.id)))
  end

  defp put_hand_score(player, hand) when is_list(hand) do
    player
    |> Map.put(:hand, hand)
    |> Map.put(:score, Games.score(hand))
  end

  defp put_hand_score(player, _) do
    player
    |> Map.put(:hand, [])
    |> Map.put(:score, 0)
  end
end
