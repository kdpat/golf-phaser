defmodule Golf.Games do
  @moduledoc """
  The Games context.
  """

  import Ecto.Query, warn: false

  alias Golf.Repo
  alias Golf.Users.User
  alias Golf.Games.{Game, Player}

  @doc """
  Returns the list of games.

  ## Examples

      iex> list_games()
      [%Game{}, ...]

  """
  def list_games do
    Repo.all(Game)
  end

  @doc """
  Gets a single game.

  Raises `Ecto.NoResultsError` if the Game does not exist.

  ## Examples

      iex> get_game!(123)
      %Game{}

      iex> get_game!(456)
      ** (Ecto.NoResultsError)

  """
  def get_game!(id), do: Repo.get!(Game, id)

  def get_game(id), do: Repo.get(Game, id)

  def get_game(id, preloads) do
    Repo.get(Game, id)
    |> Repo.preload(preloads)
  end

  @doc """
  Inserts a game.

  ## Examples

      iex> insert_game(%{field: value})
      {:ok, %Game{}}

      iex> insert_game(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def insert_game(attrs \\ %{}) do
    %Game{}
    |> Game.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a game.

  ## Examples

      iex> update_game(game, %{field: new_value})
      {:ok, %Game{}}

      iex> update_game(game, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_game(%Game{} = game, attrs) do
    game
    |> Game.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a game.

  ## Examples

      iex> delete_game(game)
      {:ok, %Game{}}

      iex> delete_game(game)
      {:error, %Ecto.Changeset{}}

  """
  def delete_game(%Game{} = game) do
    Repo.delete(game)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking game changes.

  ## Examples

      iex> change_game(game)
      %Ecto.Changeset{data: %Game{}}

  """
  def change_game(%Game{} = game, attrs \\ %{}) do
    Game.changeset(game, attrs)
  end

  def create_game(%User{} = host) do
    player = %{user_id: host.id, turn: 0}

    {:ok, game} =
      %{host_id: host.id, players: [player]}
      |> insert_game()

    Map.update!(game, :players, &Enum.map(&1, fn p -> Map.put(p, :user, host) end))
  end

  def add_player(%Game{} = game, %User{} = user) do
    player_turn = length(game.players)

    {:ok, player} =
      %Player{}
      |> Player.changeset(%{user_id: user.id, turn: player_turn})
      |> Repo.insert()

    player = Map.put(player, :user, user)
    Map.update!(game, :players, fn ps -> ps ++ [player] end)
  end
end
