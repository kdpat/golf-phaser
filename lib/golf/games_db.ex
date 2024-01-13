defmodule Golf.GamesDb do
  @moduledoc """
  The Games context.
  """

  import Ecto.Query, warn: false

  alias Golf.Repo
  alias Golf.Users.User
  alias Golf.Games.{Game, Player, Round, Event}

  @players_query from(p in Player, order_by: p.turn)
  @rounds_query from(r in Round, order_by: [desc: :inserted_at])
  @events_query from(e in Event, order_by: [desc: :inserted_at])

  @game_preloads [
    players: {@players_query, [:user]},
    rounds: {@rounds_query, [events: @events_query]}
  ]

  def get_game(id, preloads \\ @game_preloads) do
    Repo.get(Game, id)
    |> Repo.preload(preloads)
  end

  def list_games do
    Repo.all(Game)
  end

  def insert_game(attrs \\ %{}) do
    %Game{}
    |> Game.changeset(attrs)
    |> Repo.insert()
  end

  def update_game(%Game{} = game, attrs) do
    game
    |> Game.changeset(attrs)
    |> Repo.update()
  end

  def delete_game(%Game{} = game) do
    Repo.delete(game)
  end

  def change_game(%Game{} = game, attrs \\ %{}) do
    Game.changeset(game, attrs)
  end

  def create_game(%User{} = host) do
    Game.new_changeset(host)
    |> Repo.insert!()
    |> Repo.preload(@game_preloads)
  end

  def add_player(%Game{} = game, %User{} = user) do
    turn = length(game.players)
    attrs = %{game_id: game.id, user_id: user.id, turn: turn}

    player =
      %Player{}
      |> Player.changeset(attrs)
      |> Repo.insert!()
      |> Map.put(:user, user)

    {:ok, append_player(game, player)}
  end

  defp append_player(game, player) do
    Map.update!(game, :players, fn ps -> ps ++ [player] end)
  end

  def create_round(%Game{} = game) do
    round =
      Round.new_changeset(game)
      |> Repo.insert!()
      |> Map.put(:events, [])

    {:ok, prepend_round(game, round)}
  end

  defp prepend_round(game, round) do
    Map.update!(game, :rounds, fn rs -> [round | rs] end)
  end
end
