defmodule Golf.GamesDb do
  @moduledoc """
  The Games context.
  """

  import Ecto.Query, warn: false

  alias Golf.Repo
  alias Golf.Users.User
  alias Golf.Games
  alias Golf.Games.{Game, Player, Round, Event}

  @players_query from(p in Player, order_by: p.turn)
  @rounds_query from(r in Round, order_by: [desc: :id])
  @events_query from(e in Event, order_by: [desc: :id])

  @game_preloads [
    players: {@players_query, [:user]},
    rounds: {@rounds_query, [events: @events_query]}
  ]

  def get_game(id, preloads \\ @game_preloads) do
    Repo.get(Game, id)
    |> Repo.preload(preloads)
  end

  def game_exists?(id) do
    from(g in Game, where: [id: ^id])
    |> Repo.exists?()
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

  def create_game(id, %User{} = host, users) do
    Game.new_changeset(id, host, users)
    |> Repo.insert!()
    |> Repo.preload(@game_preloads)
  end

  def add_player(%Game{} = game, %User{} = user) do
    player_turn = length(game.players)
    attrs = %{game_id: game.id, user_id: user.id, turn: player_turn}

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
      Games.new_round(game)
      |> Round.changeset()
      |> Repo.insert!()
      |> Map.put(:events, [])

    {:ok, prepend_round(game, round)}
  end

  defp prepend_round(game, round) do
    Map.update!(game, :rounds, fn rs -> [round | rs] end)
  end

  def handle_event(%Game{rounds: []}, _event) do
    {:error, :no_round}
  end

  def handle_event(%Game{rounds: [%Round{state: :round_over} | _]}, _event) do
    {:error, :round_over}
  end

  def handle_event(%Game{rounds: [round | _]} = game, %Event{} = event) do
    with {:ok, round} = handle_round_event(round, event) do
      {:ok, replace_current_round(game, round)}
    end
  end

  defp replace_current_round(game, round) do
    rounds = List.replace_at(game.rounds, 0, round)
    Map.put(game, :rounds, rounds)
  end

  def handle_round_event(%Round{} = round, %Event{} = event) do
    Repo.transaction(fn ->
      event =
        event
        |> Event.changeset(%{round_id: round.id})
        |> Repo.insert!()

      round_changes = Games.round_changes(round, event)

      round
      |> Round.changeset(round_changes)
      |> Repo.update!()
      |> prepend_event(event)
    end)
  end

  defp prepend_event(round, event) do
    Map.put(round, :events, [event | round.events])
  end
end
