defmodule Golf.Games.GameData do
  alias Golf.Games

  @derive Jason.Encoder
  defstruct [:id, :userId, :hostId, :turn, :state, :deck, :tableCards, :players, :playerId, :playableCards]

  def new(game, user) do
    player_index = Enum.find_index(game.players, fn p -> p.user.id == user.id end)
    player = if player_index, do: Enum.at(game.players, player_index)
    # num_players = length(game.players)
    # positions = player_positions(num_players)
    round = Games.current_round(game)
    # held_card = round && round.held_card

    playable_cards =
      if round && player do
        Games.playable_cards_round(round, player)
      else
        []
      end

    players =
      game.players
      |> maybe_rotate(player_index)

    %__MODULE__{
      id: game.id,
      userId: user.id,
      hostId: game.host_id,
      turn: round && round.turn,
      state: Games.current_state(game),
      deck: round && round.deck,
      tableCards: round && round.table_cards,
      players: players,
      playerId: player && player.id,
      playableCards: playable_cards
    }
  end

  defp player_positions(num_players) do
    case num_players do
      1 -> ~w(bottom)
      2 -> ~w(bottom top)
      3 -> ~w(bottom left right)
      4 -> ~w(bottom left top right)
    end
  end

  def rotate(list, n) do
    {left, right} = Enum.split(list, n)
    right ++ left
  end

  def maybe_rotate(list, n) when n in [0, nil], do: list
  def maybe_rotate(list, n), do: rotate(list, n)
end
